---
layout: post
title: "Performance of Sequential Rust Programs"
date: 2013-04-18 16:09
comments: true
categories: 
---

Although Rust is designed for parallel programs, it is important that the performance of single-threaded, sequential programs not suffer in its design. As far as Servo is concerned, sequential performance is still important in many domains that a Web browser engine must compete in.

Below are some selected single-threaded benchmarks from the [Computer Language Benchmarks Game][shootout] (formerly, and still informally, called the "shootout"). *This is far from an ideal set.* These benchmarks are showing their age quite heavily, they are too small and simplistic to extrapolate to real-world use cases, and many of them are too I/O-bound.

It is perfectly legal per the rules of the benchmarks game to use unsafe code (or calling libraries written in C, which is equivalent), and I believe it's very difficult to precisely match C's performance without resorting to unsafe code. (Practically speaking, one would need an extremely smart JIT, or a research language with a complex dependent type system.) As my colleague Niko pointed out, a more interesting benchmark would not allow *any* languages to use unsafe code and would exclude C and C++ from competing at all, except as a point of comparison—such a benchmark would be interesting to determine how much performance one has to trade for type safety in mainstream languages. But the shootout is what it is, and so the Rust versions of these benchmarks heavily use unsafe code. Over time, I hope to be able to reduce the amount of unsafe code present in the Rust versions of these benchmarks, but a couple of benchmarks will likely always remain unsafe.

*Neither the C nor the Rust versions of these benchmarks use SIMD or threads.* This is by design, as the goal of this test is to measure Rust's sequential performance. Over time, as Rust gains SIMD support and the scheduler improves (both of which are active areas of development), the benchmarks will be updated to use multiple threads. But keep in mind that *the C implementation tested against is not usually the top one on the shootout site; rather, I selected the fastest implementation that did not use SIMD or threads for comparison.* As the Rust benchmarks are updated to use SIMD and threads, equivalent C versions will be used for comparison.

For all these reasons and more, it is important to not read too much into these benchmark results. It would be a mistake to conclude that "Rust is faster than C" because of the performance on the `k-nucleotide` benchmark. Likewise, it would be a mistake to conclude that "C is faster than Rust" because of the `fasta-redux` benchmark. The goal here is simply to demonstrate that *sequential Rust can be written in a way that approaches competitive parity with equivalent C code.*

Enough disclaimers; on to the results:

![Results](http://i.imgur.com/YxjT8wp.png)

These programs were tested on a 2.53 GHz Intel Core 2 Duo MacBook Pro with 4 GB of RAM, running Mac OS X 10.6 Snow Leopard. "GCC 4.2" is GCC 4.2.1, Apple build 5666; "clang 1.7" is Apple clang 1.7, based on LLVM 2.9svn. Three runs were averaged together to produce each result. Results are normalized to GCC 4.2. Lower numbers are better.

As mentioned before, this is a selected set of benchmarks. The benchmarks that were not included are:

* `fasta` is omitted because it is similar to `fasta-redux`.

* `regexp-dna` is omitted because it consists of an uninteresting binding to PCRE.

* `binary-trees` is omitted because it is a garbage collection benchmark and the C version uses an arena, defeating the purpose (although I suspect a Rust version that did the same would do well).

* `chameneos-redux` and `threadring` are omitted because they are threading benchmarks.

You can see the changes to the Rust compiler that were made to optimize these tests, as well as the benchmark sources, on my [branch][1] of the compiler on GitHub. The goal will be to land these changes over the next few days.

[1]: https://github.com/pcwalton/rust/tree/shootout
[shootout]: http://benchmarksgame.alioth.debian.org/
