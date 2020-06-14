---
layout: post
title: "A Gentle Introduction to Traits in Rust"
date: 2012-08-08 10:46
comments: true
categories: 
---

Rust traits pack a lot of flexibility into a simple system, and they're one of my favorite features of the language. But as a result of the rapid pace of the language's development, there's been a fair amount of confusion as to how they work. As such, I figured I'd write up a quick tutorial explaining why and how to use them.

This tutorial assumes only basic knowledge of C-like languages, so I'll try to explain everything specific to Rust that might be unclear along the way. Also note that a couple of these features are unimplemented, so if you try this today the syntax will be a little different.

Simple implementations
----------------------

In keeping with the theme of my previous blog posts on classes, let's start by writing a game. I'll start by defining a struct `Monster` and a struct `Player` like this:

    struct Monster {
        name: &str;      // `&str` is a reference to a string
        mut health: int; // `mut` indicates that the health can be changed
    }

    struct Player {
        mut health: int;
    }

Now I can create instances of each:

    fn main() {  // `fn` defines a function
        let monster = Monster {
        	name: "Gelatinous Cube",
			health: 50
		};
		let player = Player {
			health: 100
		};
    }

Without some functionality, this isn't a particularly interesting game. So let's add a method to `Monster`:

	impl Monster {
		fn attack(&self, player: &Player) {
		    // fmt! is string formatting; this prints "Gelatinous Cube hits you!"
			io::println(fmt!("%s hits you!", self.name));
			player.health -= 10;
		}
	}

And I can call it this way, inside `main`:

	monster.attack(&player);

There are several things to note here.

* References are explicit in Rust: the `&` sigil indicates that the method `attack` takes a reference to the player, not the player itself. If I didn't write that, then the player would be copied into the method instead (and we'd get a compiler warning, because this indicates a bug).

* I use the keyword `impl` to declare methods for a type. `impl` declarations can appear  anywhere in the module that declared the type. The `struct` and `impl` pair appears a lot in Rust code; it nicely separates out data from implementation. Objective-C and C++ programmers will find this familiar.

* Within an implementation, functions with a `self` parameter become methods. Python programmers will find this "explicit self" familiar. Because references are explicit in Rust, you specify how `self` is supposed to be passed; in this case, by reference (`&self`).

Generics
--------

Now that we have basic implementations covered, let's look at something completely different: generics. (We'll come back to implementations later on.) Like many other languages, Rust features generic functions: functions that can operate on many different types. For example, here's a function that returns true if a vector is empty:

	// Vectors are written with square brackets around the type; e.g. a vector of
	// ints is written `[int]`.
	fn is_empty<T>(v: &[T]) -> bool {
		return v.len() == 0;
	}

The generic type parameters are written inside the angle brackets (`<` and `>`), after the function name.

There's nothing much more to say here; generics are pretty simple. In this form, however, they're pretty limited, as we'll see.

Limitations of generics
-----------------------

Let's go back to our game example. Suppose I want to add functionality to save the state of the game to disk in [JSON](https://en.wikipedia.org/wiki/JSON). I'll implement some methods on `Monster` and `Player` to do this:

	impl Monster {
		// `~str` means "a pointer to a string that'll be automatically freed"
		fn to_json(&self) -> ~str {
			return fmt!("{ name: \"%s\", health: %d }", self.name, self.health);
		}
	}
	
	impl Player {
		fn to_json(&self) -> ~str {
			return fmt!("{ health: %d }", self.health);
		}
	}

Now imagine that I wanted a function to save any actor (either a monster or a player) into a file. Because monsters and players are different types, I need to use a generic function to handle both. My first attempt at the function looks like this:

	fn save<T>(filename: &str, actor: &T) {
		// Because the writer returns an error code, I use .get() to mean "require
		// that this succeeded, and abort the program if it didn't".
		let writer = io::file_writer(filename, [ io::create, io::truncate ]).get();
		writer.write(actor.to_json());
		// Because of RAII, the file will automatically be closed.
	}

Uh-oh. This doesn't compile. I get the following error: "attempted access of field `to_json` on type `&T`, but no public field or method with that name was found".

What the Rust compiler is telling me is that it doesn't know that the type `T` in this function contains the method `to_json`. And, in fact, it might not. As written above, it'd be perfectly legal to call `save` on any type at all:

	struct Penguin {
		name: &str;
	}

	save("penguin.txt", &Penguin { name: "Fred" });
	// But how do I convert penguins to JSON?

So I'm stuck. But Rust provides a solution: traits.

Trait declaration
-----------------

Traits are the way to tell the Rust compiler about *functionality that a type must provide*. They're very similar in spirit to interfaces in Java, C#, and Go, and are similar in implementation to typeclasses in Haskell. They provide the solution to the problem I'm facing: I need to tell the Rust compiler, first of all, that some types can be converted to JSON, and, additionally, for the types that can be converted to JSON, how to do it.

To define a trait, I simply use the `trait` keyword:

	trait ToJSON {
		fn to_json(&self) -> ~str;
	}

This declares a trait named `ToJSON`, with one method that all types that implement the trait must define. That method is named `to_json`, and it takes its `self` parameter by reference.

Now I can define implementations of `ToJSON` for the various types I'm interested in. These implementations are exactly the same as above, except that we add `: ToJSON`.

	impl Monster : ToJSON {
		// `~str` means "a pointer to a string that'll be automatically freed"
		fn to_json(&self) -> ~str {
			return fmt!("{ name: \"%s\", health: %d }", self.name, self.health);
		}
	}

	impl Player : ToJSON {
		fn to_json(&self) -> ~str {
			return fmt!("{ health: %d }", self.health);
		}
	}

That's all there is to it. Now I can modify the `save` function so that it does what I want.

Trait usage
-----------

Recall that the reason why the `save` function didn't compile is that the Rust compiler didn't know that the `T` type contained a `to_json` method. What I need is some way to tell the compiler that this function only accepts types that contain the methods I need to call. This is accomplished through *trait restrictions*. I modify the `save` function as follows:

	fn save<T:ToJSON>(filename: &str, actor: &T) {
		let writer = io::file_writer(filename, [ io::create, io::truncate ]).get();
		writer.write(actor.to_json());
	}

Note the addition of `:ToJSON` after the type parameter. This indicates that the function can only be called with types that implement the trait.

Now these calls to `save` will compile:

	save("player.txt", &player);
	save("monster.txt", &monster);

But this call will not:

	save("penguin.txt", &Penguin { name: "Fred" });

I get the error "failed to find an implementation of trait `ToJSON` for `Penguin`", just as expected.

Summing up
----------

These are the basic features of traits and comprise most of what Rust programmers will need to know. There are only a few more features beyond these, which I'll mention briefly:

* *Special traits*. Some traits are known to the compiler and represent the built-in operations. Most notably, this includes the ubiquitous `copy` trait, which invokes the copy operation that occurs when you assign with `let x = y`. You'll see `T:copy` in many generic functions for this reason. Other special traits include `send`, which is a trait that indicates the type is sendable, and `add`, `sub`, etc, which indicate the built-in arithmetic operators. The key is that, in all cases, traits simply specify *what a generic type can do*; when you want to do something with a type parameter like `T`, you specify a trait.

* *Generic traits*. Traits can be generic, which is occasionally useful.

* *Default implementations*. It's often helpful for traits to provide default implementations of their methods that take over when the type doesn't provide an implementation of its own. For example, the default implementation of `to_json()` might want to use the Rust reflection API to automatically create JSON for any type, even if that type doesn't manually implement the `to_json()` method. (Note that this feature is currently being implemented.)

* *Trait composition*. Sometimes we want one trait to include another trait. For example, the `Num` trait, which all number types in the language implement, obviously includes addition, subtraction, multiplication, etc. Trait composition allows traits to be "glued together" in this way. Note that this isn't *inheritance*; it's simply a convenience that allows trait methods to be combined together, like a mixin. (This is not fully implemented yet.)

* *First-class trait values*. Rarely, it's necessary to have a trait be a first-class value, like in Java or Go, instead of attached to a generic type parameter. This doesn't come up particularly often, but Rust does support it in the rare cases in which it's needed. Idiomatic Rust uses generics instead of Java-like interfaces.

That's about all there is to traits. Traits are essentially Rust's object system, but they're simpler than many object systems and integrate especially well with generics.
