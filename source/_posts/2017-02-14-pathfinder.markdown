---
layout: post
title: "Pathfinder, a fast GPU-based font rasterizer in Rust"
date: 2017-02-14 11:03
comments: false
categories: 
---

Ever since some initial discussions with [Raph Levien] (author of `font-rs`) at RustConf last
September, I've been thinking about ways to improve vector graphics rendering using modern graphics
hardware, specifically for fonts. These ideas began to come together in December, and over the past
couple of months I've been working on actually putting them into a real, usable library. They've
proved promising, and now I have some results to show.

Today I'm pleased to announce [Pathfinder], a Rust library for OpenType font rendering. The goal is
nothing less than to be the fastest vector graphics renderer in existence, and the results so far
are extremely encouraging. Not only is it very fast according to the traditional metric of raw
rasterization performance, it's *practical*, featuring very low setup time (end-to-end time
superior to the best CPU rasterizers), best-in-class rasterization performance even at small glyph
sizes, minimal memory consumption (both on CPU and GPU), compatibility with existing font formats,
portability to most graphics hardware manufactured in the past five years (DirectX 10 level), and
security/safety.

## Performance

To illustrate what it means to be both practical and fast, consider these two graphs:

<a href="/images/post-images/pathfinder-rasterize.svg"><!--
--><img alt="Rasterization performance" src="/images/post-images/pathfinder-rasterize.svg"><!--
--></a>

<a href="/images/post-images/pathfinder-setup.svg"><!--
--><img alt="Setup performance" src="/images/post-images/pathfinder-setup.svg"><!--
--></a>

(Click each graph for a larger version.)

The first graph is a comparison of Pathfinder with other rasterization algorithms with all vectors
already prepared for rendering (and uploaded to the GPU, in the case of the GPU algorithms). The
second graph is the total time taken to prepare and rasterize a glyph at a typical size, measured
from the point right after loading the OTF file in memory to the completion of rasterization. Lower
numbers are better. All times were measured on a Haswell Intel Iris Pro (mid-2015 MacBook Pro).

From these graphs, we can see two major problems with existing GPU-based approaches:

1. *Many algorithms aren't that fast, especially at small sizes.* Algorithms aren't fast just
   because they run on the GPU! In general, we want rendering on the GPU to be faster than
rendering on the CPU; that's often easier said than done, because modern CPUs are surprisingly
speedy. (Note that, even if the GPU is somewhat slower at a task than the CPU, it may be a win for
CPU-bound apps to offload some work; however, this makes the use of the algorithm highly
situational.) It's much better to have an algorithm that actually beats the CPU.

2. *Long setup times can easily eliminate the speedup of algorithms in practice.* This is known as
   the "end-to-end" time, and real-world applications must carefully pay attention to it. One of
the most common use cases for a font rasterizer is to open a font file, rasterize a character set
from it (Latin-1, say) at one pixel size for later use, and throw away the file. With Web fonts now
commonplace, this use case becomes even more important, because Web fonts are frequently rasterized
once and then thrown away as the user navigates to a new page. Long setup times, whether the result
of tessellation or more exotic approaches, are real problems for these scenarios, since what the
user cares about is the document appearing quickly. Faster rasterization doesn't help if it
regresses that metric.

(Of the two problems mentioned above, the second is often totally ignored in the copious literature
on GPU-based vector rasterization. I'd like to see researchers start to pay attention to it. In
most scenarios, we don't have the luxury of inventing our own GPU-friendly vector format. We're not
going to get the world to move away from OpenType and SVG.)

## Vector drawing basics

In order to understand the details of the algorithm, some basic knowledge of vector graphics is
necessary. Feel free to skip this section if you're already familiar with Bézier curves and fill
rules.

OpenType fonts are defined in terms of resolution-independent [Bézier curves]. TrueType outlines
contain lines and quadratic Béziers only, while OpenType outlines can contain lines, quadratic
Béziers, and cubic Béziers. (Right now, Pathfinder only supports quadratic Béziers, but extending
the algorithm to support cubic Béziers should be straightforward.)

In order to fill vector paths, we need a *fill rule*. A fill rule is essentially a test that
determines, for every point, whether that point is inside or outside the curve (and therefore
whether it should be filled in). OpenType's fill rule is the *[winding rule]*, which can be
expressed as follows:

1. Pick a point that we want to determine the color of. Call it P.

2. Choose any point outside the curve. (This is easy to determine since any point outside the
   bounding box of the curve is trivially outside the curve.) Call it Q.

3. Let the *winding number* be 0.

4. Trace a straight line from Q to P. Every time we cross a curve going clockwise, add 1 to the
   winding number. Every time we cross a curve going counterclockwise, subtract 1 from the winding
number.

5. The point is inside the curve (and so should be filled) if and only if the winding number is not
zero.

## How it works, conceptually

The basic algorithm that Pathfinder uses is the by-now-standard trapezoidal pixel coverage
algorithm pioneered by Raph Levien's libart (to the best of my knowledge). Variations of it are
used in FreeType, [`stb_truetype` version 2.0 and up], and [`font-rs`]. These implementations
differ as to whether they use sparse or dense representations for the coverage buffer. Following
`font-rs`, and unlike FreeType and `stb_truetype`, Pathfinder uses a dense representation for
coverage. As a result, [Raph's description of the algorithm] applies fairly well to Pathfinder as
well.

There are two phases to the algorithm: *drawing* and *accumulation*. During the draw phase,
Pathfinder computes *coverage deltas* for every pixel touching (or immediately below) each curve.
During the accumulation phase, the algorithm sweeps down each column of pixels, computing
winding numbers (fractional winding numbers, since we're antialiasing) and filling pixels
appropriately.

The most important concept to understand is that of the coverage delta. When drawing high-quality
antialiased curves, we care not only about whether each pixel is inside or outside the curve but
also *how much* of the pixel is inside or outside the curve. We treat each pixel that a curve
passes through as a small square and compute how much of the square the curve occupies. Because we
break down curves into small lines before rasterizing them, these coverage areas are always
trapezoids or triangles, and so and so we can use trapezoidal area expressions to calculate them.
The exact formulas involved are somewhat messy and involve several special cases; see [Sean
Barrett's description of the `stb_truetype` algorithm] for the details.

Rasterizers that calculate coverage in this way differ in whether they calculate winding numbers
and fill at the same time they calculate coverage or whether they fill in a separate step after
coverage calculation. Sparse implementations like FreeType and `stb_truetype` usually fill as they
go, while dense implementations like `font-rs` and Pathfinder fill in a separate step. Filling in a
separate step is attractive because it can be simplified to a [prefix sum] over each pixel column
if we store the coverage for each pixel as *the difference between the coverage of the pixel and
the coverage of the pixel above it*. In other words, instead of determining the area of each pixel
that a curve covers, for each pixel we determine how much *additional* area the curve covers,
relative to the coverage area of the immediately preceding pixel.

This modification has the very attractive property that *all coverage deltas both inside and
outside the curve are zero*, since points completely inside a curve contribute no *additional* area
(except for the first pixel completely inside the curve). This property is key to Pathfinder's
performance relative to most vector texture algorithms. Calculating exact area coverage is slow,
but calculating coverage deltas instead of absolute coverage essentially allows us to limit the
expensive calculations to the *edges* of the curve, reducing the amount of work the GPU has to do
to a fraction of what it would have to do otherwise.

In order to fill the outline and generate the final glyph image, we simply have to sweep down each
column of pixels, calculating the running total of area coverage and writing pixels according to
the winding rule. The formula to determine the color of each pixel is simple and fast:
`min(|coverage total so far|, 1.0)` (where 0.0 is a fully transparent pixel, 1.0 is a fully opaque
pixel, and values in between are different shades). Importantly, all columns are completely
independent and can be calculated in parallel.

## Implementation details

With the advanced features in OpenGL 4.3, this algorithm can be straightforwardly adapted to the
GPU.

1. As an initialization step, we create a *coverage buffer* to hold delta coverage values. This
   coverage buffer is a single-channel floating-point framebuffer. We always draw to the
framebuffer with blending enabled (`GL_FUNC_ADD`, both source and destination factors set to
`GL_ONE`).

2. We expand the TrueType outlines from the variable-length compressed `glyf` format inside the
   font to a fixed-length, but still compact, representation. This is necessary to be able to
operate on vertices in parallel, since variable-length formats are inherently sequential. These
outlines are then uploaded to the GPU.

3. Next, we draw each curve as a *patch*. In a tessellation-enabled drawing pipeline like the one
   that Pathfinder uses, rather than submitting triangles directly to the GPU, we submit abstract
patches which are converted into triangles in hardware. We use indexed drawing (`glDrawElements`)
to take advantage of the GPU's [post-transform cache], since most vertices belong to two curves.

4. For each path segment that represents a Bézier curve, we tessellate the Bézier curve into a
   series of small lines on the GPU. Then we expand all lines out to screen-aligned quads
encompassing their bounding boxes. (There is a complication here when these quads overlap; we may
have to generate extra one-pixel-wide quads here and strip them out with backface culling. See the
comments inside the tessellation control shader for details.)

5. In the fragment shader, we calculate trapezoidal coverage area for each pixel and write it to
   the coverage buffer. This completes the draw step.

6. To perform the accumulation step, we attach the coverage buffer and the destination texture to
   images. We then dispatch a simple compute shader with one invocation per pixel column. For each
row, the shader reads from the coverage buffer and writes the total coverage so far to the
destination texture. The `min(|coverage total so far, 1.0)` expression above need not be computed
explicitly, because our unsigned normalized atlas texture stores colors in this way automatically.

The performance characteristics of this approach are excellent. No CPU preprocessing is needed
other than the conversion of the variable-length TrueType outline to a fixed-length format. The
number of draw calls is minimal—any number of glyphs can be rasterized in one draw call, even from
different fonts—and the depth and stencil buffers remain unused. Because the tessellation is
performed on the fly instead of on the CPU, the amount of data uploaded to the GPU is minimal. Area
coverage is essentially only calculated for pixels on the *edges* of the outlines, avoiding
expensive fragment shader invocations for all the pixels inside each glyph. The final accumulation
step has ideal characteristics for GPU compute, since branch divergence is nonexistent and cache
locality is maximized. All pixels in the final buffer are only painted at most once, regardless of
the number of curves present.

## Compatibility concerns

For any GPU code designed to be shipping to consumers, especially OpenGL 3.0 and up, compatibility
and portability are always concerns. As Pathfinder is designed for OpenGL 4.3, released in 2012, it
is no exception. Fortunately, the algorithm can be adapted in various ways depending on the
available functionality.

* When compute shaders are not available (OpenGL 4.2 or lower), Pathfinder uses OpenCL 1.2 instead.
  This is the case on the Mac, since Apple has not implemented any OpenGL features newer than
OpenGL 4.2 (2011). The [compute-shader] crate abstracts over the subset of OpenGL and OpenCL
necessary to access GPU compute functionality.

* When tessellation shaders are not available (OpenGL 3.3 or lower), Pathfinder uses geometry
  shaders, available in OpenGL 3.2 and up.

(Note that it should be possible to avoid both geometry shaders and tessellation shaders, at the
cost of performing that work on the CPU. This turns out to be quite fast. However, since image
load/store is a hard requirement, this seems pointless: both image load/store and geometry shaders
were introduced in DirectX 10-level hardware.)

Although these system requirements may seem high at first, the integrated graphics found in any
Intel Sandy Bridge (2011) CPU or later meet them.

## Future directions

The immediate next step for Pathfinder is to integrate into WebRender as an optional accelerated
path for applicable fonts on supported GPUs. Beyond that, there are several features that could
be added to extend Pathfinder itself.

1. *Support vector graphics outside the font setting.* As Pathfinder is a generic vector graphics
   rasterizer, it would be interesting to expose an API allowing it to be used as the backend for
e.g. an SVG renderer. Rendering the entire SVG specification is outside of the scope of Pathfinder
itself, but it could certainly be the path rendering component of a full SVG renderer.

2. *Support CFF and CFF2 outlines.* These have been seen more and more over time, e.g. in Apple's
   new San Francisco font. Adding this support involves both parsing and extracting the [CFF2
format] and adding support for cubic Bézier curves to Pathfinder.

3. *Support WOFF and WOFF2.* In the case of WOFF2, this involves writing a parser for the
transformed `glyf` table.

4. *Support subpixel antialiasing.* This should be straightforward.

5. *Support emoji*. The Microsoft `COLR` and Apple `sbix` extensions are straightforward, but the
   Google `SVG` table allows arbitrary SVGs to be embedded into a font. Full support for SVG is
probably out of scope of Pathfinder, but perhaps the subset used in practice is small enough to
support.

6. *Optimize overlapping paths.* It would be desirable to avoid antialiasing edges that are covered
   by other paths. The fill rule makes this trickier than it initially sounds.

7. *Support hinting.* This is low-priority since it's effectively obsolete with high-quality
   antialiasing, subpixel AA, and high-density displays, but it might be useful to match the system
rendering on Windows.

## Conclusion

Pathfinder is [available on GitHub] and should be easily buildable using the stable version of Rust
and Cargo.  Please feel free to check it out, build it, and report bugs! I'm especially interested
in reports of poor performance, crashes, or rendering problems on a variety of hardware. As
Pathfinder does use DirectX 10-level hardware features, some amount of driver pain is unavoidable.
I'd like to shake these problems out as soon as possible.

Finally, I'd like to extend a special thanks to Raph Levien for many fruitful discussions and
ideas. This project wouldn't have been possible without his insight and expertise.

[Pathfinder]: https://github.com/pcwalton/pathfinder
[`stb_truetype` version 2.0 and up]: http://nothings.org/gamedev/rasterize/
[`font-rs`]: https://medium.com/@raphlinus/inside-the-fastest-font-renderer-in-the-world-75ae5270c445
[Raph's description of the algorithm]: https://medium.com/@raphlinus/inside-the-fastest-font-renderer-in-the-world-75ae5270c445
[Bézier curves]: https://en.wikipedia.org/wiki/B%C3%A9zier_curve
[Winding rule]: https://en.wikipedia.org/wiki/Nonzero-rule
[Sean Barrett's description of the `stb_truetype` algorithm]: http://nothings.org/gamedev/rasterize/
[prefix sum]: https://en.wikipedia.org/wiki/Prefix_sum
[post-transform cache]: https://www.khronos.org/opengl/wiki/Post_Transform_Cache
[compute-shader]: https://github.com/pcwalton/compute-shader
[CFF2 format]: https://www.microsoft.com/typography/otspec/cff2.htm
[available on GitHub]: https://github.com/pcwalton/pathfinder
[Raph Levien]: http://levien.com/



