---
layout: post
title: "The Two Meanings of \"impl\""
date: 2012-12-30 10:42
comments: true
categories: 
---

`impl` declarations in Rust have two forms. The subtle distinction between the two can be confusing at first, so I'll briefly explain the difference here.

The first form of `impl` is a *type implementation*. (Earlier I was calling this an "anonymous trait", but I think that this terminology is probably more confusing than it's worth.) This form allows you to define *new* functions associated with a type. For example:

    struct Dog {
		name: ~str
	}
	
	impl Dog {
		static fn new(name: ~str) -> Dog {
			return Dog { name: name };
		}
		
		fn speak(&self) {
			io::println("woof");
		}
	}

This example defines new functions `new` and `speak` under the `Dog` namespace. Here's an example of their use:

	let dog = Dog::new("Snoopy");
	Dog::speak(&dog); // note: doesn't work today, see note below

(The explicit call of the form `Dog::speak(&dog)` doesn't work today, but I wrote it out to emphasize the fact that `speak` lives in the `Dog` namespace. It's likely to work in the future, though. Today, you need to write `dog.speak()`.)

The second form of `impl`, on the other hand, is a *trait implementation*. It's distinguished from the first form by the presence of a `:` followed by the name of a trait. This form allows you to provide an implementation for one or more *existing* functions belonging to a trait. It doesn't define any new functions. For instance, suppose I defined this trait:

    trait Animal {
        static fn species(&self) -> ~str;
    }

Then I can supply an implementation of `species()` for my `Dog` structure like this:

    impl Dog : Animal {
        static fn species(&self) -> ~str {
            return ~"Canis lupus familiaris";
        }
    }

The key point to notice here is that this form doesn't define any new names. This code won't compile:

    let dog = Dog::new("Fido");
	io::println(Dog::species(&dog)); // unresolved name: `species`

But this code will:

    let dog = Dog::new("Spot");
    io::println(Animal::species(&dog));

The reason is that a trait implementation only provides the implementation of one or more *existing* functions rather than defining new functions. The function `species` is part of the `Animal` trait; it's not part of `Dog`.

(You might reasonably ask: Why not duplicate the name `species` into `Dog`, for convenience? The reason is because of name collisions: it should be possible to implement `Animal` and later implement another trait with a different function called `species` without breaking existing code.)

So the upshot of this is that there are two forms of implementations in Rust: the type implementation, which defines new functions, and the trait implementation, which attaches functionality to existing functions. Both use the `impl` keyword, but they're different forms with different meanings.
