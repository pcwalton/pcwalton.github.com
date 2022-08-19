---
layout: post.html
title: "Drawing CSS Box Shadows in WebRender"
published_date: 2015-12-21 11:08:00 -0800

categories: 
---

I recently landed a [change](https://github.com/glennw/webrender/commit/d57057470cb2bddf0c8ece3fc29cfbe5d03114a2) in WebRender to draw [CSS box shadows](https://developer.mozilla.org/en-US/docs/Web/CSS/box-shadow) using a specialized shader. Because it's an unusual approach to drawing shadows, I thought I'd write up how it works.

Traditionally, browsers have drawn box shadows [in three passes](https://dxr.mozilla.org/mozilla-central/source/gfx/thebes/gfxBlur.cpp#624): (1) draw the unblurred box (or a nine-patch corner/edge for one); (2) blur in the horizontal direction; (3) blur in the vertical direction. This works because a Gaussian blur is a [separable filter](https://en.wikipedia.org/wiki/Separable_filter): it can be computed as the product of two one-dimensional convolutions. This is a reasonable approach, but it has downsides. First of all, it has a high cost in memory bandwidth; for a standard triple box blur on the CPU, every pixel is touched 6 times, and on the GPU every pixel is touched `$$6 sigma$$` times (or `$$3 sigma$$` times if a common linear interpolation trick is used), not counting the time needed to draw the unblurred image in the first place. (`$$sigma$$` here is [half the specified blur radius](http://dbaron.org/log/20110225-blur-radius).) Second, the painting of each box shadow requires no fewer than three draw calls including (usually) one shader switch, which are expensive, especially on mobile GPUs. On the GPU, it's often desirable to use parallel algorithms that reduce the number of draw calls and state changes, even if those algorithms have a large number of raw floating-point operations—simply because the GPU is a stream processor that's designed for such workloads.

The key trick used in WebRender is to take advantage of the fact that we're blurring a (potentially rounded) *box*, not an ordinary image. This allows us to express the Gaussian blur in (in the case of an unrounded box) a closed form and (in the case of a rounded box) a closed form minus a sum computed with a small loop. To draw a box shadow, WebRender runs a shader implementing this logic and caches the results in a nine-patch image mask stored in a texture atlas. If the page contains multiple box shadows (even those with heterogeneous sizes and radii), the engine batches all the invocations of this shader into one draw call. This means that, no matter how many box shadows are in use, the number of draw calls and state changes remains constant (as long as the size of the texture atlas isn't exhausted). Driver overhead and memory bandwidth are minimized, and the GPU spends as much time as possible in raw floating-point computation, which is exactly the kind of workload it's optimized for.

The remainder of this post will be a dive into the logic of the fragment shader itself. The [source code](https://github.com/glennw/webrender/blob/d57057470cb2bddf0c8ece3fc29cfbe5d03114a2/res/box_shadow.fs.glsl) may be useful as a reference.

For those unfamiliar with OpenGL, per-pixel logic is expressed with a *fragment shader* (sometimes called a *pixel shader*). A fragment shader (in this case) is conceptually a function that maps arbitrary per-pixel input data to the RGB values defining the resulting color for that pixel. In our case, the input data for each pixel simply consists of the `$$x$$` and `$$y$$` coordinates for that pixel. We'll call our function `$$RGB(u,v)$$` and define it as follows:

	$$RGB(u,v) = sum_{y=-oo}^{oo} sum_{x=-oo}^{oo}G(x-u)G(y-v)RGB_{"rounded box"}(x,y)$$

Here, `$$RGB_{"rounded box"}(x,y)$$` is the color of the unblurred, possibly-rounded box at the coordinate `$$(x,y)$$`, and `$$G(x)$$` is the Gaussian function used for the blur:

    $$G(x)=1/sqrt(2 pi sigma^2) e^(-x^2/(2 sigma^2))$$

A Gaussian blur in one dimension is a convolution that maps each input pixel to an average of the pixels adjacent to it weighted by `$$G(x)$$`, where `$$x$$` is the distance from the output pixel. A two-dimensional Gaussian blur is simply the product of two one-dimensional Gaussian blurs, one for each dimension. This definition leads to the formula for `$$RGB(x,y)$$` above.

Since CSS box shadows blur solid color boxes, the color of each pixel is either the color of the shadow (call it `$$RGB_{"box"}$$`) or transparent. We can rewrite this into two functions:

	$$RGB(x,y) = RGB_{"box"}C(x,y)$$

and

	$$C(u,v) = sum_{y=-oo}^{oo} sum_{x=-oo}^{oo}G(x-u)G(y-v)C_{"rounded box"}(x,y)$$

where `$$C_{"rounded box"}(x,y)$$` is 1.0 if the point $$(x,y)$$ is inside the unblurred, possibly-rounded box and 0.0 otherwise.

Now let's start with the simple case, in which the box is unrounded. We'll call this function `$$C_{"blurred box"}$$`:

	$$C_{"blurred box"}(u,v) = sum_{y=-oo}^{oo} sum_{x=-oo}^{oo}G(x-u)G(y-v)C_{"box"}(x,y)$$

where `$$C_{"box"}(x,y)$$` is 1.0 if the point $$(x,y)$$ is inside the box and 0.0 otherwise.

Let `$$x_{"min"}, x_{"max"}, y_{"min"}, y_{"max"}$$` be the left, right, top, and bottom extents of the box respectively. Then `$$C_{"box"}(x,y)$$` is 1.0 if `$$x_{"min"} <= x <= x_{"max"}$$` and `$$y_{"min"} <= y <= y_{"max"}$$` and 0.0 otherwise. Now let's rearrange `$$C_{"blurred box"}(x,y)$$` above:

	$$C_{"blurred box"}(u,v) =
		(sum_{y=-oo}^{y_{"min"} - 1}
			sum_{x=-oo}^{x=oo} G(x-u)G(y-v)C_{"box"}(x,y)) +
		(sum_{y=y_{"min"}}^{y_{"max"}}
			(sum_{x=-oo}^{x_{"min"}-1} G(x-u)G(y-v)C_{"box"}(x,y)) +
			(sum_{x=x_{"min"}}^{x_{"max"}} G(x-u)G(y-v)C_{"box"}(x,y)) +
			(sum_{x=x_{"max"}+1}^{x=oo} G(x-u)G(y-v)C_{"box"}(x,y))) +
		(sum_{y=y_{"max"} + 1}^{oo}
			sum_{x=-oo}^{x=oo} G(x)G(y)C_{"box"}(x,y))$$

We can now eliminate several of the intermediate sums, along with `$$C_{"box"}(x,y)$$`, using its definition and the sum bounds:

	$$C_{"blurred box"}(u,v) = sum_{y=y_{"min"}}^{y_{"max"}} sum_{x=x_{"min"}}^{x_{"max"}} G(x-u)G(y-v)$$

Now let's simplify this expression to a closed form. To begin with, we'll approximate the sums with integrals:

	$$C_{"blurred box"}(u,v) ~~ int_{y_{"min"}}^{y_{"max"}} int_{x_{"min"}}^{x_{"max"}} G(x-u)G(y-v) dxdy$$

	$$= int_{y_{"min"}}^{y_{"max"}} G(y-v) int_{x_{"min"}}^{x_{"max"}} G(x-u) dxdy$$

Now the inner integral can be evaluated to a closed form:

	$$int_{x_{"min"}}^{x_{"max"}}G(x-u)dx
		= int_{x_{"min"}}^{x_{"max"}}1/sqrt(2 pi sigma^2) e^(-(x-u)^2/(2 sigma^2))dx
		= 1/2 "erf"((x_{"max"}-u)/(sigma sqrt(2))) - 1/2 "erf"((x_{"min"}-u)/(sigma sqrt(2)))$$

`$$"erf"(x)$$` here is the [Gauss error function](https://en.wikipedia.org/wiki/Error_function). It is not found in GLSL (though it is found in `<math.h>`), but it does have the following [approximation](https://en.wikipedia.org/wiki/Error_function#Approximation_with_elementary_functions) suitable for evaluation on the GPU:

	$$"erf"(x) ~~ 1 - 1/((1+a_1x + a_2x^2 + a_3x^3 + a_4x^4)^4)$$

where `$$a_1$$` = 0.278393, `$$a_2$$` = 0.230389, `$$a_3$$` = 0.000972, and `$$a_4$$` = 0.078108.

Now let's finish simplifying `$$C(u,v)$$`:

	$$C_{"blurred box"}(u,v) ~~
		int_{y_{"min"}}^{y_{"max"}} G(y-v) int_{x_{"min"}}^{x_{"max"}} G(x-u) dxdy$$
	
	$$= int_{y_{"min"}}^{y_{"max"}} G(y-v)
		(1/2 "erf"((x_{"max"}-u)/(sigma sqrt(2))) - 1/2 "erf"((x_{"min"}-u)/(sigma sqrt(2)))) dy$$
	
	$$= 1/2 "erf"((x_{"max"}-u)/(sigma sqrt(2))) - 1/2 "erf"((x_{"min"}-u)/(sigma sqrt(2)))
		int_{y_{"min"}-v}^{y_{"max"}} G(y-v) dy$$
		
	$$= 1/4 ("erf"((x_{"max"}-u)/(sigma sqrt(2))) - "erf"((x_{"min"}-u)/(sigma sqrt(2))))
			("erf"((y_{"max"}-v)/(sigma sqrt(2))) - "erf"((y_{"min"}-v)/(sigma sqrt(2))))$$

And this gives us our closed form formula for the color of the blurred box.

Now for the real meat of the shader: the handling of nonzero border radii. CSS allows boxes to have *elliptical radii* in the corners, with separately defined major axis and minor axis lengths. Each corner can have separately defined radii; for simplicity, we only consider boxes with identical radii on all corners in this writeup, although the technique readily generalizes to heterogeneous radii. Most border radii on the Web are circular and homogeneous, but to handle CSS properly our shader needs to support elliptical heterogeneous radii in their full generality.

As before, the basic function to compute the pixel color looks like this:

	$$C(u,v) = sum_{y=-oo}^{oo} sum_{x=-oo}^{oo}G(x-u)G(y-v)C_{"rounded box"}(x,y)$$

where `$$C_{"rounded box"}(x,y)$$` is 1.0 if the point $$(x,y)$$ is inside the box (now with rounded corners) and 0.0 otherwise.

Adding some bounds to the sums gives us:

	$$C(u,v) = sum_{y=y_{"min"}}^{y_{"max"}} sum_{x=x_{"min"}}^{x_{"max"}} G(x-u)G(y-v)
		C_{"rounded box"}(x,y)$$

`$$C_{"rounded box"}(x,y)$$` is 1.0 if `$$C_{"box"}(x,y)$$` is 1.0—i.e. if the point `$$(x,y)$$` is inside the unrounded box—*and* the point is either inside the ellipse defined by the value of the `border-radius` property or outside the border corners entirely. Let `$$C_{"inside corners"}(x,y)$$` be 1.0 if this latter condition holds and 0.0 otherwise—i.e. 1.0 if the point `$$(x,y)$$` is inside the ellipse defined by the corners or completely outside the corner area. Graphically, `$$C_{"inside corners"}(x,y)$$` looks like a blurry version of this:

<div style="margin: 0 auto 1em; width: 300px; height: 200px; background: black; position: relative;">
	<div style="top: 25px; left: 25px; width: 250px; height: 150px; background: white; position: absolute;">
		<div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: black; border-radius: 25px;"></div>
	</div>
</div>

Then, because `$$C_{"box"}(x,y)$$` is always 1.0 within the sum bounds, `$$C_{"rounded box"}(x,y)$$` reduces to `$$C_{"inside corners"}(x,y)$$`:

	$$C(u,v) = sum_{y=y_{"min"}}^{y_{"max"}} sum_{x=x_{"min"}}^{x_{"max"}} G(x-u)G(y-v)
		C_{"inside corners"}(x,y)$$

Now let `$$C_{"outside corners"}(x,y)$$` be the inverse of `$$C_{"inside corners"}(x,y)$$`—i.e. `$$C_{"outside corners"}(x,y) = 1.0 - C_{"inside corners"}(x,y)$$`. Intuitively, `$$C_{"outside corners"}(x,y)$$` is 1.0 if `$$(x,y)$$` is *inside* the box but *outside* the rounded corners—graphically, it looks like one <span style="display: inline-block; position: relative; width: 1em; height: 1em; overflow: hidden;"><span style="display: block; position: absolute; border-radius: 100%; width: 200%; height: 200%; top: -100%; left: -100%; border: solid black 1em;"></span></span> shape for each corner. With this, we can rearrange the formula above:

	$$C(u,v) = sum_{y=y_{"min"}}^{y_{"max"}} sum_{x=x_{"min"}}^{x_{"max"}} G(x-u)G(y-v)
		(1.0 - C_{"outside corners"}(x,y))$$
	
	$$= sum_{y=y_{"min"}}^{y_{"max"}} sum_{x=x_{"min"}}^{x_{"max"}} G(x-u)G(y-v) -
		G(x-u)G(y-v)C_{"outside corners"}(x,y)$$
		
	$$= (sum_{y=y_{"min"}}^{y_{"max"}} sum_{x=x_{"min"}}^{x_{"max"}} G(x-u)G(y-v)) -
		sum_{y=y_{"min"}}^{y_{"max"}} sum_{x=x_{"min"}}^{x_{"max"}}
			G(x-u)G(y-v)C_{"outside corners"}(x,y)$$
			
	$$= C_{"blurred box"}(u,v) -
		sum_{y=y_{"min"}}^{y_{"max"}} sum_{x=x_{"min"}}^{x_{"max"}}
			G(x-u)G(y-v)C_{"outside corners"}(x,y)$$

We've now arrived at our basic strategy for handling border corners: compute the color of the blurred unrounded box, then "cut out" the blurred border corners by subtracting their color values. We already have a closed form formula for `$$C_{"blurred box"}(x,y)$$`, so let's focus on the second term. We'll call it `$$C_{"blurred outside corners"}(x,y)$$`:

	$$C_{"blurred outside corners"}(u,v) = sum_{y=y_{"min"}}^{y_{"max"}} sum_{x=x_{"min"}}^{x_{"max"}}
			G(x-u)G(y-v)C_{"outside corners"}(x,y)$$

Let's subdivide `$$C_{"outside corners"}(x,y)$$` into the four corners: top left, top right, bottom right, and bottom left. This is valid because every point belongs to at most one of the corners per the CSS specification—corners cannot overlap.

	$$C_{"blurred outside corners"}(u,v) = sum_{y=y_{"min"}}^{y_{"max"}} sum_{x=x_{"min"}}^{x_{"max"}}
			G(x-u)G(y-v)(C_{"outside TL corner"}(x,y) + C_{"outside TR corner"}(x,y)
			+ C_{"outside BR corner"}(x,y) + C_{"outside BL corner"}(x,y))$$
	
	$$= (sum_{y=y_{"min"}}^{y_{"max"}} sum_{x=x_{"min"}}^{x_{"max"}}
			G(x-u)G(y-v)(C_{"outside TL corner"}(x,y) + C_{"outside TR corner"}(x,y))) +
			sum_{y=y_{"min"}}^{y_{"max"}} sum_{x=x_{"min"}}^{x_{"max"}}
				G(x-u)G(y-v)(C_{"outside BR corner"}(x,y) + C_{"outside BL corner"}(x,y))$$
				
	$$= (sum_{y=y_{"min"}}^{y_{"max"}} G(y-v)
		((sum_{x=x_{"min"}}^{x_{"max"}} G(x-u)C_{"outside TL corner"}(x,y)) +
		sum_{x=x_{"min"}}^{x_{"max"}} G(x-u) C_{"outside TR corner"}(x,y))) +
		sum_{y=y_{"min"}}^{y_{"max"}} G(y-v)
				((sum_{x=x_{"min"}}^{x_{"max"}} G(x-u)C_{"outside BL corner"}(x,y)) +
				sum_{x=x_{"min"}}^{x_{"max"}} G(x-u)C_{"outside BR corner"}(x,y))$$

Let `$$a$$` and `$$b$$` be the horizontal and vertical border radii, respectively. The vertical boundaries of the top left and top right corners are defined by `$$y_min$$` on the top and `$$y_min + b$$` on the bottom; `$$C_{"outside TL corner"}(x,y)$$` and `$$C_{"outside TR corner"}(x,y)$$` will evaluate to 0 if `$$y$$` lies outside this range. Likewise, the vertical boundaries of the bottom left and bottom right corners are `$$y_max - b$$` and `$$y_max$$`.

(Note, again, that we assume all corners have equal border radii. The following simplification depends on this, but the overall approach doesn't change.)

Armed with this simplification, we can adjust the vertical bounds of the sums in our formula:

	$$C_{"blurred outside corners"}(u,v) =
		(sum_{y=y_{"min"}}^{y_{"min"} + b} G(y-v)
			((sum_{x=x_{"min"}}^{x_{"max"}} G(x-u)C_{"outside TL corner"}(x,y)) +
			sum_{x=x_{"min"}}^{x_{"max"}} G(x-u) C_{"outside TR corner"}(x,y))) +
		sum_{y=y_{"max"} - b}^{y_{"max"}} G(y-v)
				((sum_{x=x_{"min"}}^{x_{"max"}} G(x-u)C_{"outside BL corner"}(x,y)) +
				sum_{x=x_{"min"}}^{x_{"max"}} G(x-u)C_{"outside BR corner"}(x,y))$$

And, following similar logic, we can adjust their horizontal bounds:

	$$C_{"blurred outside corners"}(u,v) =
		(sum_{y=y_{"min"}}^{y_{"min"} + b} G(y-v)
			((sum_{x=x_{"min"}}^{x_{"min"} + a} G(x-u)C_{"outside TL corner"}(x,y)) +
			sum_{x=x_{"max"} - a}^{x_{"max"}} G(x-u) C_{"outside TR corner"}(x,y))) +
		sum_{y=y_{"max"} - b}^{y_{"max"}} G(y-v)
				((sum_{x=x_{"min"}}^{x_{"min"} + a} G(x-u)C_{"outside BL corner"}(x,y)) +
				sum_{x=x_{"max"} - a}^{x_{"max"}} G(x-u)C_{"outside BR corner"}(x,y))$$

At this point, we can work on eliminating all of the `$$C_{"outside corner"}$$` functions from our expression. Let's look at the definition of `$$C_{"outside TR corner"}(x,y)$$`. `$$C_{"outside TR corner"}(x,y)$$` is 1.0 if the point `$$(x,y)$$` is inside the rectangle formed by the border corner but outside the ellipse that defines that corner. That is, `$$C_{"outside TR corner"}(x,y)$$` is 1.0 if `$$y_{"min"} <= y <= y_{"min"} + b$$` and `$$E_{"TR"}(y) <= x <= x_{"max"}$$`, where `$$E_{"TR"}(y)$$` defines the horizontal position of the point on the ellipse with the given `$$y$$` coordinate. `$$E_{"TR"}(y)$$` can easily be derived from the equation of an ellipse centered at `$$(x_0, y_0)$$:

	$$(x-x_0)^2/a^2 + (y-y_0)^2/b^2 = 1$$
	
	$$(x-x_0)^2 = a^2(1 - (y-y_0)^2/b^2)$$
	
	$$x = x_0 + sqrt(a^2(1 - (y-y_0)^2/b^2))$$
	
	$$E_{"TR"}(y) = x_0 + a sqrt(1 - ((y-y_0)/b)^2)$$

Parallel reasoning applies to the other corners.

Now that we have bounds within which each `$$C_{"outside corner"}$$` function evaluates to 1.0, we can eliminate all of these functions from the definition of `$$C_{"blurred outside corners"}$$`:

	$$C_{"blurred outside corners"}(u,v) =
		(sum_{y=y_{"min"}}^{y_{"min"} + b} G(y-v)
			((sum_{x=x_{"min"}}^{E_{"TL"}(y)} G(x-u)) +
			sum_{x=E_{"TR"}(y)}^{x_{"max"}} G(x-u))) +
		sum_{y=y_{"max"} - b}^{y_{"max"}} G(y-v)
				((sum_{x=x_{"min"}}^{E_{"BL"}(y)} G(x-u)) +
				sum_{x=E_{"BR"}(y)}^{x_{"max"}} G(x-u))$$

To simplify this a bit further, let's define an intermediate function:

	$$E(y, y_0) = a sqrt(1 - ((y - y_0)/b)^2)$$

And rewrite `$$C_{"blurred outside corners"}(x,y)$$` as follows:

	$$C_{"blurred outside corners"}(u,v) =
		(sum_{y=y_{"min"}}^{y_{"min"} + b} G(y-v)
			((sum_{x=x_{"min"}}^{x_{"min"} + a - E(y, y_{"min"} + b)} G(x-u)) +
			sum_{x=x_{"max"} - a + E(y, y_{"min"} + b)}^{x_{"max"}} G(x-u))) +
		(sum_{y=y_{"max" - b}}^{y_{"max"}} G(y-v)
			((sum_{x=x_{"min"}}^{x_{"min"} + a - E(y, y_{"max"} - b)} G(x-u)) +
			sum_{x=x_{"max"} - a + E(y, y_{"max"} - b)}^{x_{"max"}} G(x-u)))$$

Now we simply follow the procedure we did before for the box. Approximate the inner sums with integrals:

	$$C_{"blurred outside corners"}(u,v) ~~
		(sum_{y=y_{"min"}}^{y_{"min"} + b} G(y-v)
			((int_{x_{"min"}}^{x_{"min"} + a - E(y, y_{"min"} + b)} G(x-u)dx) +
			int_{x_{"max"} - a + E(y, y_{"min"} + b)}^{x_{"max"}} G(x-u)dx)) +
		(sum_{y=y_{"max" - b}}^{y_{"max"}} G(y-v)
			((int_{x_{"min"}}^{x_{"min"} + a - E(y, y_{"max"} - b)} G(x-u)dx) +
			int_{x_{"max"} - a + E(y, y_{"max"} - b)}^{x_{"max"}} G(x-u)dx))$$

Replace `$$int G(x)dx$$` with its closed-form solution:

	$$C_{"blurred outside corners"}(u,v) ~~
		(sum_{y=y_{"min"}}^{y_{"min"} + b} G(y-v)
			(1/2 "erf"((x_{"min"} - u + a - E(y, y_{"min"} - v + b)) / (sigma sqrt(2))) -
			 1/2 "erf"((x_{"min"} - u) / (sigma sqrt(2))) +
			 (1/2 "erf"((x_{"max"} - u) / (sigma sqrt(2))) -
			  1/2 "erf"((x_{"max"} - u - a + E(y, y_{"min"} - v + b)) / (sigma sqrt(2)))))) +
		 sum_{y=y_{"max"} - b}^{y_{"max"}} G(y-v)
		 			(1/2 "erf"((x_{"min"} - u + a - E(y, y_{"max"} - v - b)) / (sigma sqrt(2))) -
		 			 1/2 "erf"((x_{"min"} - u) / (sigma sqrt(2))) +
		 			 (1/2 "erf"((x_{"max"} - u) / (sigma sqrt(2))) -
		 			  1/2 "erf"((x_{"max"} - u - a + E(y, y_{"max"} - v - b)) / (sigma sqrt(2)))))$$

	$$= 1/2 (sum_{y=y_{"min"}}^{y_{"min"} + b} G(y-v)
			("erf"((x_{"min"} - u + a - E(y, y_{"min"} - v + b)) / (sigma sqrt(2))) -
			 "erf"((x_{"min"} - u) / (sigma sqrt(2))) +
			 ("erf"((x_{"max"} - u) / (sigma sqrt(2))) -
			  "erf"((x_{"max"} - u - a + E(y, y_{"min"} - v + b)) / (sigma sqrt(2)))))) +
		 sum_{y=y_{"max"} - b}^{y_{"max"}} G(y-v)
		 			("erf"((x_{"min"} - u + a - E(y, y_{"max"} - v - b)) / (sigma sqrt(2))) -
		 			 "erf"((x_{"min"} - u) / (sigma sqrt(2))) +
		 			 ("erf"((x_{"max"} - u) / (sigma sqrt(2))) -
		 			  "erf"((x_{"max"} - u - a + E(y, y_{"max"} - v - b)) / (sigma sqrt(2)))))$$

And we're done! Unfortunately, this is as far as we can go with standard mathematical functions. Because the parameters to the error function depend on `$$y$$`, we have no choice but to evaluate the inner sum numerically. Still, this only results in [one loop in the shader](https://github.com/glennw/webrender/blob/d57057470cb2bddf0c8ece3fc29cfbe5d03114a2/res/box_shadow.fs.glsl#L86).

The [current version of the shader](https://github.com/glennw/webrender/blob/d57057470cb2bddf0c8ece3fc29cfbe5d03114a2/res/box_shadow.fs.glsl) implements the algorithm basically as described here. There are several further improvements that could be made:

1. The Gauss error function approximation that we use is accurate to `$$5 xx 10^-4$$`, which is way more accurate than we need. (Remember that the units here are 8-bit color values!) The approximation involves computing `$$x, x^2, x^3, " and " x^4$$`, which is expensive since we evaluate the error function many times for each pixel. It could be a nice speedup to replace this with a less accurate, faster approximation. Or we could use a lookup table.

2. We should not even compute the amount to subtract from the corners if the pixel in question is more than `$$3 sigma$$` pixels away from them.

3. `$$C_{"blurred outside corners"}(x,y)$$` is a function of sigmoid shape. It might be interesting to try approximating it with a logistic function to avoid the loop in the shader. It might be possible to do this with a few iterations of least squares curve fitting on the CPU or with some sort of lookup table. Unfortunately, the parameters to the approximation will have to be per-box-shadow, because `$$C_{"blurred outside corners"}$$` depends on `$$a$$`, `$$b$$`, `$${x, y}_{"min, max"}$$`, and `$$sigma$$`.

4. Evaluating `$$G(x)$$` could also be done with a lookup table. There is already [a GitHub issue](https://github.com/glennw/webrender/issues/66) filed on this.

Finally, it would obviously be nice to perform some comprehensive benchmarks of this rendering algorithm, fully optimized, against the standard multiple-pass approach to drawing box shadows. In general, WebRender is not at all GPU bound on most hardware (like most accelerated GPU vector graphics rasterizers), so optimizing the count of GPU raster operations has not been a priority so far. When and if this changes (which I suspect it will as the rendering pipeline gets more and more optimized), it may be worth going back and optimizing the shader to reduce the load on the ALU. For now, however, this technique seems to perform quite well in basic testing, and since WebRender is so CPU bound it seems likely to me that the reduction in draw calls and state changes will make this technique worth the cost.