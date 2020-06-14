---
layout: post
title: "Revamped Parallel Layout in Servo"
date: 2014-02-25 17:19
comments: true
categories: 
---

Over the past week I've submitted a [series of][1] [pull requests][2] that significantly revamp the way parallel layout works in Servo. Originally I did this work to improve performance, but it's also turned out to be necessary to implement more advanced CSS 2.1 features. As it's a fairly novel algorithm (as far as I'm aware) I'd like to take some time to explain it. I'll start with where we are in Servo head and explain how it evolved into what's in my branch. This post assumes a little knowledge about how browser engines work, but little else.

## Overview

Servo's layout operates on a *flow tree*, which is similar to the *render tree* in WebKit or Blink and the *frame tree* in Gecko. We call it a flow tree rather than a render tree because it consists of two separate data types: *flows*, which are organized in a tree, and *boxes*, which belong to flows and are organized in a flat list. Roughly speaking, a *flow* is an object that can be laid out in parallel with other flows, while a *box* is a box that must be laid out sequentially with other boxes in the same flow. If you're familiar with WebKit, you can think of a box as a `RenderObject`, and if you're familiar with Gecko, you can think of a box as a `nsFrame`. We want to lay out boxes in parallel as much as possible in Servo, so we group boxes into *flows* that can be laid out in parallel with one another.

Here's a simple example. Suppose we have the following document:

	<html>
	<body>
		<p>Four score and seven years ago our <b>fathers</b> brought forth on this
		continent, a new nation, conceived in Liberty, and dedicated to the
		proposition that all men are created equal.</p>
		<p>Now we are engaged in a great civil war, testing whether that nation,
		or any nation so conceived and so dedicated, can long endure. We are met
		on a great battle-field of that war. We have come to <i>dedicate</i> a
		portion of that field, as a final resting place for those who here gave
		their lives that that nation might live. It is altogether fitting and
		proper that we should do this.</p>
	</body>
	</html>

This would result in the following flow tree:

![(Flow tree)][img-a]

Notice that there are three inline boxes under each `InlineFlow`. We have multiple boxes for each because each contiguous sequence of text in the same style—known as a *text run*—needs a box. During layout, the structure of the flow tree remains immutable, but the boxes get cut up into separate lines, so there will probably be many more boxes after layout (depending on the width of the window).

One neat thing about this two-level approach is that boxes end up flattened into a flat list instead of a linked data structure, improving cache locality and memory usage and making style recalculation faster because less needs to be allocated. Another benefit (and in fact the original impetus for this data structure) is that the line breaking code need not traverse trees in order to do its work—it only needs to traverse a single array, making the code simpler and improving cache locality.

Now that we know how the flow tree looks, let's look at how Servo currently performs layout to figure out where boxes should go.

## The current algorithm

The current algorithm for parallel layout in Servo (i.e. what's in the master branch before my changes) consists of three separate passes over the flow tree.

1. *Intrinsic width calculation* or `bubble_widths` (bottom-up). This computes the *minimum width* and *preferred width* for each flow. There are no sequential hazards here and this can always be computed in parallel. Note that this is information is not always needed during layout, and eventually we will probably want to implement optimizations to avoid computation of this information for subtrees in which it is not needed.

2. *Actual width calculation* or `assign_widths` (top-down). This computes the width of each flow, along with horizontal margins and padding values.

3. *Height calculation* or `assign_heights` (bottom-up). This computes the height of each flow. Along the way, line breaking is performed, and floats are laid out. We also compute vertical margins and padding, including margin collapse.

Within each flow, boxes are laid out sequentially—this is necessary because, in normal text, where to place the next line break depends on the lines before it. (However, we may be able to lay boxes out in parallel for `white-space: nowrap` or `white-space: pre`.)

For simple documents that consist of blocks and inline flows, Servo achieves excellent parallel wins, in line with [Leo Meyerovich's "Fast and Parallel Webpage Layout"][3], which implemented this simple model.

## The problem with floats

Unfortunately, in the real world there is one significant complication: floats. Here's an example of a document involving floats that illustrates the problem:

	<div style="float: right">
		I shot the sheriff.
		But I swear it was in self-defense.
		I shot the sheriff.
		And they say it is a capital offense.
	</div>
	<div>
		I shot the sheriff
		But I didn't shoot no deputy.
	</div>
	<div>
		All around in my home town,
		They're tryin' to track me down;
		They say they want to bring me in guilty
		For the killing of a deputy,
		For the life of a deputy.
	</div>

Rendered with a little extra formatting added, it looks like this:

<div style='margin-left: auto; margin-right: auto; width: 300px; font: 14px "Times New Roman";'>
	<div style="float: right; width: 150px; white-space: pre-wrap; background-color: #0a0; color: white;">I shot the sheriff.
But I swear it was in self-defense.
I shot the sheriff.
And they say it is a capital offense.</div>
   <div style="white-space: pre-wrap">I shot the sheriff
But I didn't shoot no deputy.</div>
	<div style="white-space: pre-wrap; margin-top: 12px;">All around in my home town,
They're tryin' to track me down;
They say they want to bring me in guilty
For the killing of a deputy,
For the life of a deputy.</div>
</div>

The flow tree for this document might look like this:

![(Flow tree)][img-b]

Notice how the float in green ("I shot the sheriff…") affects where the line breaks go in the two blocks to its left and below it ("I shot the sheriff…" and "All around…"). Line breaking is performed during the *height assignment* phase in Servo, because where the line breaks go determines the height of each flow.

This has important implications for the parallel algorithm described above. We don't know how tall the float is until we've laid it out, and its height determines where to place the line breaks in the blocks next to it, so we have to lay out the float before laying out the blocks next to it. This means that we have to lay out the float before laying out any blocks that it's adjacent to. But, more subtly, floats prevent us from laying out all the blocks that they impact in parallel as well. The reason is that we don't know how many floats "stick out" of a block until we know its height, and in order to perform line breaking for a block we have to know how many floats "stuck out" of all the blocks before it. Consider the difference between the preceding document and this one:

<div style='margin-left: auto; margin-right: auto; width: 300px; font: 14px "Times New Roman";'>
	<div style="float: right; width: 150px; white-space: pre-wrap; background-color: #0a0; color: white;">I shot the sheriff.
But I swear it was in self-defense.
I shot the sheriff.
And they say it is a capital offense.</div>
   <div style="white-space: pre-wrap">I shot the sheriff
But I didn't shoot no deputy.
I shot the sheriff
But I didn't shoot no deputy.</div>
	<div style="white-space: pre-wrap; margin-top: 12px;">All around in my home town,
They're tryin' to track me down;
They say they want to bring me in guilty
For the killing of a deputy,
For the life of a deputy.</div>
</div>

The only difference between the first document and the this one is that the first unfloated block ("I shot the sheriff…") is taller. But this impacts the height of the second block ("All around…"), by affecting where the lines get broken. So the key thing to note here is that, in general, *floats force us to sequentialize the processing of the blocks next to them*.

The way this was implemented in Servo before my pull requests is that any floats in the document caused all unfloated blocks to be laid out sequentially. (The floats themselves could still be laid out in parallel, but all other blocks in the page were laid out in order.) Unsurprisingly, this caused our parallel gains to evaporate on most real-world Web pages. The vast majority of modern Web pages do use floats in some capacity, as they're one of the most popular ways to create typical layouts. So losing our parallel gains is quite unfortunate.

Can we do better? It turns out we can.

## Clearing floats

As most designers know, the `float` property comes with a very useful companion property: `clear`. The `clear` property causes blocks to be shifted down in order to avoid impacting floats in one or both directions. For example, the document above with `clear: right` added to the second block looks like this:

<div style='margin-left: auto; margin-right: auto; width: 300px; font: 14px "Times New Roman";'>
	<div style="float: right; width: 150px; white-space: pre-wrap; background-color: #0a0; color: white;">I shot the sheriff.
But I swear it was in self-defense.
I shot the sheriff.
And they say it is a capital offense.</div>
   <div style="white-space: pre-wrap">I shot the sheriff
But I didn't shoot no deputy.</div>
	<div style="clear: right; white-space: pre-wrap; margin-top: 12px;">All around in my home town,
They're tryin' to track me down;
They say they want to bring me in guilty
For the killing of a deputy,
For the life of a deputy.</div>
</div>

This property is widely used on the Web to control where floats can appear, and we can take advantage of this to gain back parallelism. If we know that no floats can impact a block due to the use of the `clear` property, then we can lay it out in parallel with the blocks before it. In the document above, the second block ("All around…") can be laid out at the same time as the float and the first block.

My second pull request implements this optimization in this way: During flow construction, which is a bottom-up traversal, we keep track of a flag, `has_floated_descendants`, and set it on each flow if it or any of its descendants are `FloatFlow` instances. (Actually, there are two such flags—`has_left_floated_descendants` and `has_right_floated_descendants`—but for the purposes of this explanation I'll just treat it as one flag.) During width computation, we iterate over our children and set two flags: `impacted_by_floats`. (Again, there are actually two such flags—`impacted_by_left_floats` and `impacted_by_right_floats`.) `impacted_by_floats` is true for a flow if and only if any of the following is true:

1. The parent flow is impacted by floats.

2. The flow has floated descendants.

3. Any previous sibling flow is impacted by floats, *unless* the appropriate `clear` property has been set between this flow and that sibling.

Only subtrees that have `impacted_by_floats` set to true are laid out sequentially, in order. The remaining subtrees can be laid out in parallel.

With this optimization implemented, documents above can be laid out in parallel as much as possible. It helps many real-world Web pages, as `clear` is a very commonly-used property.

At this point, two questions arise: "Can we do even more?" and "Is this algorithm enough to properly handle CSS?" As you might expect, the answer to the first is "yes", and the answer to the second is "no". To understand why, we need dive into the world of *block formatting contexts*.

## Block formatting contexts

The behavior of `overflow: hidden` is subtle. Consider this document, which is identical to the document we've been using but with `overflow: hidden` specified on the blocks adjacent to the float:

	<div style="float: right">
		I shot the sheriff.
		But I swear it was in self-defense.
		I shot the sheriff.
		And they say it is a capital offense.
	</div>
	<div style="overflow: hidden">
		I shot the sheriff
		But I didn't shoot no deputy.
	</div>
	<div style="overflow: hidden">
		All around in my home town,
		They're tryin' to track me down;
		They say they want to bring me in guilty
		For the killing of a deputy,
		For the life of a deputy.
	</div>
	</div>

Rendered, it looks like this:

<div style='margin-left: auto; margin-right: auto; width: 300px; font: 14px "Times New Roman";'>
	<div style="float: right; width: 150px; white-space: pre-wrap; background-color: #0a0; color: white;">I shot the sheriff.
But I swear it was in self-defense.
I shot the sheriff.
And they say it is a capital offense.</div>
   <div style="overflow: hidden; white-space: pre-wrap">I shot the sheriff
But I didn't shoot no deputy.</div>
	<div style="overflow: hidden; white-space: pre-wrap; margin-top: 12px;">All around in my home town,
They're tryin' to track me down;
They say they want to bring me in guilty
For the killing of a deputy,
For the life of a deputy.</div></div>
</div>

Notice that, with `overflow: hidden` specified, the float makes the entire width of the block next to it smaller: all the lines have been wrapped, not just those that impact the float. 

What's going on here is that `overflow: hidden` establishes what's known as a [block formatting context] [4] in CSS jargon. In Servo, block formatting contexts make our layout algorithm significantly more complex, because they require *width assignment and height assignment to be intertwined*, and for *height assignment to be interruptible*. To see why this is, recall that the flow tree for this document looks like this:

![(Flow tree)][img-b]

Remember that Servo's layout algorithm performs width calculation top-down, then height calculation bottom-up—this works under the assumption that widths never depend on heights. But with block formatting contexts adjacent to floats, this is no longer true: *the width of a block formatting context depends on the height of floats next to it*. This is because we don't know whether a float, such as the green float above, is tall enough to impact a block formatting context, like those that the "I shot the sheriff…" and "All around…" above establish, until we lay out all blocks prior to the context and the float itself. And without knowing that, we cannot assign the width of the block formatting contexts.

To handle this case, my patches change Servo's layout in several ways:

1. When we see a block formatting context during width calculation, we check the value of the `impacted_by_floats` flag. If it is on, then we don't calculate widths for that flow or any of its descendants. Instead, we set a flag called `width_assignment_delayed`.

2. When we encounter a block formatting context child of a flow while calculating heights, if that block formatting context has the flag `width_assignment_delayed` set, we *suspend* the calculation of heights for that node, calculate the width of the block formatting context, and begin calculating widths and heights for that node and all of its descendants (in parallel, if possible).

3. After calculating the height of a block formatting context, we *resume* calculation of heights for its parent.

Let's look at the precise series of steps that we'll follow for the document above:

1. Calculate the width of the root flow.

2. Calculate the width of the float flow.

3. Don't calculate the widths of the two block flows; instead, set the `width_assignment_delayed` flag.

4. Calculate the width of the float flow's inline flow child. The main width assignment phase is now complete.

5. Begin height calculation. First, calculate the height of the float flow and its inline child.

6. Start calculating the height of the root flow by placing the float.

7. We see that we've hit a block formatting context that has its width assignment delayed, so we clear that flag, determine its width, and start width calculation for its descendants.

8. Calculate width for the block flow's inline child. Now width calculation is done for that subtree.

9. Calculate the height of the block flow's inline child, and the block flow itself. Now height calculation is done for this subtree.

10. Resume calculating the height of the root flow. We see that the next block formatting context has its width assignment delayed, so we assign its width and repeat steps 8 and 9.

11. We've now calculated the height of the root flow, so we're done.

Now this particular page didn't result in any parallel speedups. However, block formatting contexts can result in additional parallelism in some cases. For example, consider this document:

	<div id=sidebar style="float: left">
		<div>Coupons</div>
		<div>Freebies</div>
		<div>Great Deals</div>
	</div>
	<div id=main style="overflow: hidden">
		<div>Deals in your area:</div>
		<ul>
		<li>Buy 1 lawyer, get 1 free</li>
		<li>Free dental fillings</li>
		</ul>
	</div>

Rendered, it looks like this:

<div style='margin-left: auto; margin-right: auto; width: 300px; font: 14px "Times New Roman";'>
	<div id=sidebar style="float: left; width: 75px; background-color: #0a0; color: white;">
		<div>Coupons</div>
		<div>Freebies</div>
		<div>Great Deals</div>
	</div>
	<div id=main style="overflow: hidden">
		<div>Deals in your area:</div>
		<ul>
		<li>Buy 1 lawyer, get 1 free</li>
		<li>Free dental fillings</li>
		</ul>
	</div>
</div>

In this document, after we've laid out the sidebar, we can continue on and lay out the main part of the page entirely in parallel. We can lay out the block "Deals in your area" in parallel with the two list items "Buy 1…" and "Free dental fillings". It turns out that this pattern is an extremely common way to create sidebars in real Web pages, so the ability to lay out the insides of block formatting contexts in parallel is a crucial optimization in practice. The upshot of all this is that block formatting contexts are a double-edged sword: they add an unfortunate dependency between heights and widths, but they enable us to recover parallelism even when blocks are impacted by floats, since we can lay out their interior in parallel.

## Conclusion

No doubt about it, CSS 2.1 is tricky—floats perhaps more than anything else. But in spite of their difficulties, we're finding that there are unexpected places where we can take advantage of parallelism to make a faster engine. I'm cautiously optimistic that Servo's approaching the right design here—not only to make new content faster but also to accelerate the old.

[img-a]: https://i.imgur.com/uNZSiET.png

[img-b]: https://i.imgur.com/s18ckTR.png

[1]: https://github.com/mozilla/servo/pull/1700

[2]: https://github.com/mozilla/servo/pull/1734

[3]: https://www.eecs.berkeley.edu/~lmeyerov/projects/pbrowser/pubfiles/playout.pdf

[4]: https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Block_formatting_context
