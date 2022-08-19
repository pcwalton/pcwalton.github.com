---
layout: post.html
title: "Determining Triangle Geometry in Fragment Shaders"
published_date: 2018-02-14 14:17:00 -0800
categories: 
---

When doing GPU programming, it's sometimes useful to determine the positions of the vertices of the
current triangle primitive in a fragment shader. The usual advice here is to use a geometry or
tessellation shader to gather up the positions and pass them along explicitly to the fragment
shader. It turns out, though, that there is a relatively straightforward solution without any extra
shader stages using the standard derivative functions `dFdx` and `dFdy`. It works as long as the
(non-perspective-correct) barycentric coordinates for the current fragment are available. I'm sure
I'm not the first one to come up with this technique, but a quick search didn't find any
explanations of it, so I thought I'd write it up, because it turned out to be useful in Pathfinder.

An important caveat applies: Make sure that you're sure you need to do this. It's easy to go wild
with this technique and end up with more varyings than the simple solution would call for. In
general, this technique is most useful when it saves a geometry or tessellation shader invocation.

Here I assume that the barycentric coordinates $$\lambda_0, \lambda_1, \lambda_2$$ of the current
fragment are known. They must sum to 1, so it suffices to know two of them to compute the other
one. If you need barycentric coordinates and cannot compute them from other varyings you have
around, then you can pass them to the fragment shader by declaring `noperspective in vec2 vLambda;`
and setting `vLambda` to $$(1, 0)$$, $$(0, 1)$$, and $$(0, 0)$$ for the first, second, and third
vertices respectively. We also need the gradients $$\nabla_{\lambda_0}$$ and
$$\nabla_{\lambda_1}$$. Following the example above, the function `dFdx(vLambda)` will yield
$$(D_x\lambda_0, D_x\lambda_1)$$, and `dFdy(vLambda)` will yield $$(D_y\lambda_0, D_y\lambda_1)$$.

Let $$p = (x, y)$$ be the screen-space position of the current fragment (i.e. `gl_FragCoord`), and
let $$p_r = (x + 1, y)$$ and $$p_u = (x, y + 1)$$ be the positions of the fragments to the
immediate right and above, respectively. $$\lambda_0$$, $$\lambda_1$$, and $$\lambda_2$$ are the
barycentric coordinates of the current fragment; likewise, $$\lambda_{0r}$$, $$\lambda_{1r}$$, and
$$\lambda_{2r}$$ are those of the fragment to the right, and $$\lambda_{0u}$$, $$\lambda_{1u}$$,
and $$\lambda_{2u}$$ are those of the fragment above.

We know that for all triangle vertices $$i \in \{0, 1, 2\}$$,
$$\lambda_{ir} = \lambda_i + D_x\lambda_i$$, and $$\lambda_{iu} = \lambda_i + D_y\lambda_i$$.
Putting it all together, we formulate a system of equations:

$$$
\begin{cases}
\lambda_0 v_0 + \lambda_1 v_1 + \lambda_2 v_2 & = p \\
\lambda_{r0} v_0 + \lambda_{r1} v_1 + \lambda_{r2} v_2 & = p_r \\
\lambda_{u0} v_0 + \lambda_{u1} v_1 + \lambda_{u2} v_2 & = p_u \\
\end{cases}
$$

After some algebra and the application of Cramer's rule, we get:

$$$
\begin{align} \\
v_{0x} &= \frac{
    x \det \begin{bmatrix} D_x\lambda_0 & D_y\lambda_0 \\ D_x\lambda_1 & D_y\lambda_1 \end{bmatrix}
    + \det \begin{bmatrix} D_y\lambda_0 & D_y\lambda_1 \\ \lambda_0 & \lambda_1 \end{bmatrix}
    + D_y\lambda_1
}{\det \begin{bmatrix} D_x\lambda_0 & D_y\lambda_0 \\ D_x\lambda_1 & D_y\lambda_1 \end{bmatrix}} \\
v_{0y} &= \frac{
    y \det \begin{bmatrix} D_x\lambda_0 & D_y\lambda_0 \\ D_x\lambda_1 & D_y\lambda_1 \end{bmatrix}
    + \det \begin{bmatrix} \lambda_0 & \lambda_1 \\ D_x\lambda_0 & D_x\lambda_1 \end{bmatrix}
    - D_x\lambda_1
}{\det \begin{bmatrix} D_x\lambda_0 & D_y\lambda_0 \\ D_x\lambda_1 & D_y\lambda_1 \end{bmatrix}} \\
v_{1x} &= \frac{
    x \det \begin{bmatrix} D_x\lambda_0 & D_y\lambda_0 \\ D_x\lambda_1 & D_y\lambda_1 \end{bmatrix}
    + \det \begin{bmatrix} D_y\lambda_0 & D_y\lambda_1 \\ \lambda_0 & \lambda_1 \end{bmatrix}
    - D_y\lambda_0
}{\det \begin{bmatrix} D_x\lambda_0 & D_y\lambda_0 \\ D_x\lambda_1 & D_y\lambda_1 \end{bmatrix}} \\
v_{1y} &= \frac{
    y \det \begin{bmatrix} D_x\lambda_0 & D_y\lambda_0 \\ D_x\lambda_1 & D_y\lambda_1 \end{bmatrix}
    + \det \begin{bmatrix} \lambda_0 & \lambda_1 \\ D_x\lambda_0 & D_x\lambda_1 \end{bmatrix}
    + D_x\lambda_0
}{\det \begin{bmatrix} D_x\lambda_0 & D_y\lambda_0 \\ D_x\lambda_1 & D_y\lambda_1 \end{bmatrix}} \\
v_{2x} &= \frac{
    x \det \begin{bmatrix} D_x\lambda_0 & D_y\lambda_0 \\ D_x\lambda_1 & D_y\lambda_1 \end{bmatrix}
    + \det \begin{bmatrix} D_y\lambda_0 & D_y\lambda_1 \\ \lambda_0 & \lambda_1 \end{bmatrix}
}{\det \begin{bmatrix} D_x\lambda_0 & D_y\lambda_0 \\ D_x\lambda_1 & D_y\lambda_1 \end{bmatrix}} \\
v_{2y} &= \frac{
    y \det \begin{bmatrix} D_x\lambda_0 & D_y\lambda_0 \\ D_x\lambda_1 & D_y\lambda_1 \end{bmatrix}
    + \det \begin{bmatrix} \lambda_0 & \lambda_1 \\ D_x\lambda_0 & D_x\lambda_1 \end{bmatrix}
}{\det \begin{bmatrix} D_x\lambda_0 & D_y\lambda_0 \\ D_x\lambda_1 & D_y\lambda_1 \end{bmatrix}} \\
\end{align}
$$

Notice that
$$\det \begin{bmatrix} D_x\lambda_0 & D_y\lambda_0 \\ D_x\lambda_1 & D_y\lambda_1 \end{bmatrix}$$
shows up over and over again in these formulas. That value is the Jacobian determinant $$J$$. Using
$$\lambda$$ to represent the row vector $$\begin{bmatrix} \lambda_0 & \lambda_1 \end{bmatrix}$$, we
can more succinctly rewrite the above as:

$$$
\begin{align} \\
v_{0x} &= \frac{Jx + \det \begin{bmatrix} D_y\lambda \\ \lambda \end{bmatrix} + D_y\lambda_1}{J} \\
v_{0y} &= \frac{Jy + \det \begin{bmatrix} \lambda \\ D_x\lambda \end{bmatrix} - D_x\lambda_1}{J} \\
v_{1x} &= \frac{Jx + \det \begin{bmatrix} D_y\lambda \\ \lambda \end{bmatrix} - D_y\lambda_0}{J} \\
v_{1y} &= \frac{Jy + \det \begin{bmatrix} \lambda \\ D_x\lambda \end{bmatrix} + D_x\lambda_0}{J} \\
v_{2x} &= \frac{Jx + \det \begin{bmatrix} D_y\lambda \\ \lambda \end{bmatrix}}{J} \\
v_{2y} &= \frac{Jy + \det \begin{bmatrix} \lambda \\ D_x\lambda \end{bmatrix}}{J} \\
\end{align}
$$

Along with point positions, sometimes the triangle edge vectors $$v_{01}$$, $$v_{12}$$, and
$$v_{20}$$ are useful. These have even simpler formulas:

$$$
\begin{align} \\
v_{01x} &= \frac{-(D_y\lambda_0 + D_y\lambda_1)}{J} \\
v_{01y} &= \frac{D_x\lambda_0 + D_x\lambda_1}{J} \\
v_{12x} &= \frac{D_y\lambda_0}{J} \\
v_{12y} &= \frac{-D_x\lambda_0}{J} \\
v_{20x} &= \frac{D_y\lambda_1}{J} \\
v_{20y} &= \frac{-D_x\lambda_1}{J} \\
\end{align}
$$

The expressions for the vectors $$v_{pi} = p - v_i$$ (for vertices $$i \in \{0, 1, 2\}$$) are
straightforward as well:

$$$
\begin{align} \\
v_{p0x} &= \frac{\det\begin{bmatrix} \lambda \\ D_y\lambda \end{bmatrix} - D_y\lambda_1}{J} \\
v_{p0y} &= \frac{\det\begin{bmatrix} D_x\lambda \\ \lambda \end{bmatrix} + D_x\lambda_1}{J} \\
v_{p1x} &= \frac{\det\begin{bmatrix} \lambda \\ D_y\lambda \end{bmatrix} + D_y\lambda_0}{J} \\
v_{p1y} &= \frac{\det\begin{bmatrix} D_x\lambda \\ \lambda \end{bmatrix} - D_x\lambda_0}{J} \\
v_{p2x} &= \frac{\det\begin{bmatrix} \lambda \\ D_y\lambda \end{bmatrix}}{J} \\
v_{p2y} &= \frac{\det\begin{bmatrix} D_x\lambda \\ \lambda \end{bmatrix}}{J} \\
\end{align}
$$

Below is some GLSL code to compute screen-space triangle vertex positions from
$$\lambda_0$$ and $$\lambda_1$$ (as `lambda.x` and `lambda.y` respectively).

    void vertexPositions(out vec2 outV0,
                         out vec2 outV1,
                         out vec2 outV2,
                         vec2 fragCoord,
                         vec2 lambda) {
        mat2 j = mat2(dFdx(lambda), dFdy(lambda));
        float detJ = determinant(j);
        vec2 detXY = vec2(determinant(mat2(j[1], lambda)),
                          determinant(mat2(lambda, j[0])));
        vec2 v = detJ * fragCoord + detXY;
        outV0 = (v + vec2(j[1][1], -j[0][1])) / detJ;
        outV1 = (v + vec2(-j[1][0], j[0][0])) / detJ;
        outV2 = v / detJ;
    }
