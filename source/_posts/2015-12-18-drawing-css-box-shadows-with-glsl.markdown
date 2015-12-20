---
layout: post
title: "Drawing CSS Box Shadows in WebRender"
date: 2015-12-18 21:43
comments: true
categories: 
---

Since CSS box shadows blur solid color boxes, the color of each pixel is either the color of the shadow or transparent. If we abstract the color away so that pixels inside the box have the color value 1.0 and transparent pixels have the value 0.0, we can simplify the formula above:

	$$C(x,y) = sum_{y=-oo}^{oo} sum_{x=-oo}^{oo}G(x)G(y)C_{"box"}(x,y)$$

where `$$C_{"box"}(x,y)$$` is 1.0 if the point $$(x,y)$$ is inside the box and 0.0 otherwise.

Let `$$x_{"min"}, x_{"max"}, y_{"min"}, y_{"max"}$$` be the left, right, top, and bottom extents of the box respectively. Then `$$C(x,y)$$` is 1 if `$$x >= x_{"min"} ^^ x <= x_{"max"} ^^ y >= y_{"min"} ^^ y <= y_{"max"}$$` and 0 otherwise. Let's rearrange `$$C(x,y)$$` above:

	$$C(x,y) =
		(sum_{y=-oo}^{y_{"min"} - 1}
			sum_{x=-oo}^{x=oo} G(x)G(y)C_{"box"}(x,y)) +
		(sum_{y=y_{"min"}}^{y_{"max"}}
			(sum_{x=-oo}^{x_{"min"}-1} G(x)G(y)C_{"box"}(x,y)) +
			(sum_{x=x_{"min"}}^{x_{"max"}} G(x)G(y)C_{"box"}(x,y)) +
			(sum_{x=x_{"max"}+1}^{x=oo} G(x)G(y)C_{"box"}(x,y))) +
		(sum_{y=y_{"max"} + 1}^{oo}
			sum_{x=-oo}^{x=oo} G(x)G(y)C_{"box"}(x,y))$$

We can now eliminate several of the intermediate sums, along with `$$C_{"box"}(x,y)$$`, using its definition and the sum bounds:

	$$C(x,y) = sum_{y=y_{"min"}}^{y_{"max"}} sum_{x=x_{"min"}}^{x_{"max"}} G(x)G(y)$$

Now let's simplify this expression to a closed form. To begin with, we'll approximate the sums with integrals:

	$$C(x,y) ~~ int_{y_{"min"}}^{y_{"max"}} int_{x_{"min"}}^{x_{"max"}} G(x)G(y) dxdy$$

	$$= int_{y_{"min"}}^{y_{"max"}} G(y) int_{x_{"min"}}^{x_{"max"}} G(x) dxdy$$

Now the inner integral can be evaluated to a closed form:

	$$int_{x_{"min"}}^{x_{"max"}}G(x)dx
		= int_{x_{"min"}}^{x_{"max"}}1/sqrt(2 pi sigma^2) e^(-x^2/(2 sigma^2))dx
		= 1/2 "erf"(x_{"max"}/(sigma sqrt(2))) - 1/2 "erf"(x_{"min"}/(sigma sqrt(2)))$$

`$$"erf"(x)$$` here is the [Gauss error function](https://en.wikipedia.org/wiki/Error_function). It is not found in GLSL (though it is found in `<math.h>`), but it does have the following [approximation](https://en.wikipedia.org/wiki/Error_function#Approximation_with_elementary_functions) suitable for evaluation on the GPU:

	$$"erf"(x) ~~ 1 - 1/((1+a_1x + a_2x^2 + a_3x^3 + a_4x^4)^4)$$

where `$$a_1$$` = 0.278393, `$$a_2$$` = 0.230389, `$$a_3$$` = 0.000972, and `$$a_4$$` = 0.078108.

Now let's finish simplifying `$$C(x,y)$$`:

	$$C(x,y) ~~ int_{y_{"min"}}^{y_{"max"}} G(y) int_{x_{"min"}}^{x_{"max"}} G(x) dxdy$$
	
	$$= int_{y_{"min"}}^{y_{"max"}} G(y)
		(1/2 "erf"(x_{"max"}/(sigma sqrt(2))) - 1/2 "erf"(x_{"min"}/(sigma sqrt(2)))) dy$$
	
	$$= 1/2 "erf"(x_{"max"}/(sigma sqrt(2))) - 1/2 "erf"(x_{"min"}/(sigma sqrt(2)))
		int_{y_{"min"}}^{y_{"max"}} G(y) dy$$
		
	$$= 1/4 ("erf"(x_{"max"}/(sigma sqrt(2))) - "erf"(x_{"min"}/(sigma sqrt(2))))
			("erf"(y_{"max"}/(sigma sqrt(2))) - "erf"(y_{"min"}/(sigma sqrt(2))))$$

Now for the real meat of the shader: the handling of nonzero border radii. CSS allows boxes to have *elliptical radii* in the corners, with separately defined major axis and minor axis lengths. Each corner can have separately defined radii; for simplicity, we only consider boxes with identical radii on all corners in this writeup, although the technique readily generalizes to heterogeneous radii. Most border radii on the Web are circular and homogeneous, but to handle CSS properly our shader needs to support elliptical heterogeneous radii in their full generality.

As before, the basic function to compute the pixel color looks like this:

	$$C(x,y) = sum_{y=-oo}^{oo} sum_{x=-oo}^{oo}G(x)G(y)C_{"rounded box"}(x,y)$$

where `$$C_{"rounded box"}(x,y)$$` is 1.0 if the point $$(x,y)$$ is inside the box (now with rounded corners) and 0.0 otherwise.

Adding some trivial bounds to the sums gives us:

	$$C(x,y) = sum_{y=y_{"min"}}^{y_{"max"}} sum_{x=x_{"min"}}^{x_{"max"}} G(x)G(y)
		C_{"rounded box"}(x,y)$$

`$$C_{"rounded box"}(x,y)$$` is 1.0 if `$$C_{"box"}(x,y)$$` is 1.0—i.e. if the point `$$(x,y)$$` is inside the unrounded box—*and* the point is either inside the ellipse defined by the value of the `border-radius` property or outside the border corners. Let `$$C_{"inside corner"}(x,y)$$` be 1.0 if this latter condition holds and 0.0 otherwise—i.e. 1.0 if the point `$$(x,y)$$` is inside the ellipse defined by the corners or outside the corner area entirely. Then, because `$$C_{"box"}(x,y)$$` is always 1.0 within the sum bounds, `$$C_{"rounded box"}(x,y)$$` reduces to `$$C_{"corner"}(x,y)$$`:

	$$C(x,y) = sum_{y=y_{"min"}}^{y_{"max"}} sum_{x=x_{"min"}}^{x_{"max"}} G(x)G(y)
		C_{"corner"}(x,y)$$


