---
layout: post
title: "Maximally Minimal Classes for Rust"
date: 2012-06-03 14:35
comments: true
categories: 
---

Now that classes have been implemented as per the original proposal, the other Rusters and I have been starting to get a feel for the way they work out in practice. The results are positive, but not optimal. Although they definitely succeeded in avoiding the rigidity of traditional object-oriented languages like Java, they still have two basic problems: (1) they feel somewhat out of place with the rest of the language; and (2) they're still too heavyweight. Nevertheless, the functionality that they enabled is important, and we shouldn't sacrifice it.

Language design tends to go in cycles: we grow the language to accommodate new functionality, then shrink the language as we discover ways in which the features can be orthogonally integrated into the rest of the system. Classes seem to me to be on the upward trajectory of complexity; now it's time to shrink them down. At the same time, we shouldn't sacrifice the functionality that they enable.

In Rust, classes provide five main pieces of functionality that don't otherwise exist: (1) nominal records; (2) constructors; (3) privacy on the field level; (4) attached methods; and (5) destructors. I'll go over these five features in turn and discuss how each one could be simplified.

## Nominal records

Classes in Rust are nominal records. A class in this form:

    class monster {
	    let mut health: int;
	    let name: str;
    }

Is basically the moral equivalent of:

    enum monster {
	    monster({
		    mut health: int,
		    name: str
	    })
    }

Clearly, the class form is much easier to read and much less confusing for users of the language; "enum" makes little sense as there's nothing enumerated here. Nevertheless, there's a bit of unnecessary noise in the form of the `let` keyword. We could simplify it to:

    class monster {
	    mut health: int,
	    name: str
    }

It's less typing, and it matches record syntax exactly.

## Constructors

Those who have used Rust classes in their current form know that the above example class `monster` is incomplete. I still have to define a constructor for `monster`, like so:

    class monster {
	    let mut health: int;
	    let name: str;
	
	    new(health: int, name: str) {
		    self.health = health;
			self.name = name;
		}
	}

This is probably the most burdensome part of classes as they currently stand--having to repeat each field name four times, and each type twice, is annoying. Many languages have solutions for this (CoffeeScript and Dart, for example), so we could consider adopting one of these languages' syntactic sugar for something like:

    class monster {
	    let mut health: int;
	    let name: str;
	
	    new(self.health, self.name) {}  // sugar for the above
	}

Unfortunately, it doesn't stop there. Constructors have other problems. For one, there can only be one constructor per class--this is far more restrictive than Java, which permits constructor overloading. Worse, constructors can't indicate that they failed; they can only fail the task or set some internal "this failed" flag, both of which are clearly unsatisfactory. The right way to report a recoverable error to the caller in Rust is to use the `result` type, but constructors can't return `result<self>`; they can only return `self`.

I think the easiest way to address these problems is, following the idea that classes are just nominal records, is to abolish constructors entirely and adopt record literal syntax for initializing classes. So a class like this:

    class monster {
	    mut health: int,
	    name: str
    }

Would be initialized with:

    let foe = monster {
	    health: 100,
	    name: "Bigfoot"
    };

If you want to declare one or more "constructor" functions, perhaps to signal success or failure, that's easy; they're just functions in the same crate:

    fn monster(health: int, name: str) -> result<monster> {
	    if name == "King Kong" || name == "Godzilla" {
	        ret err("Trademark violation");
        }
	    ret ok(monster { health: health, name: name });
    }

But note that you only have to write a constructor if you're doing something special, like returning an error or initializing private fields. If your class is simple and merely holds public state, then your callers can just use the record literal syntax to create instances of the class.

## Privacy

Classes in Rust allow private fields:

    class monster {
	    let priv mut health: 100;
	    let name: str;
	
	    ...
	
	    fn hit() {
		    self.health -= 10;
	    }
	}

This is extremely useful functionality for modularity. But Rust already has a mechanism for privacy, via exports. For example, in order to write an enum whose contents are hidden from the outside world:

    enum color {
	    priv red;
	    priv green;
	    priv blue;
	}

(Note that the syntax here is changing; for posterity, I'm using the new syntax, but note that the code here doesn't work at the time of this writing, as it's not yet implemented.)

Only this module can construct instances of this enum, or even inspect its contents, because while the enum itself can be named, none of its variants can. So we could apply the same principle to fields of classes:

    mod A {
	    mod B {
		    class monster {
			    priv mut health: int,
			    name: str
			}
			
			fn hit(monster: &monster) {
				monster.health -= 10;    // OK
			}
		}
		
		fn heal(monster: &monster) {
	        monster.health += 10;        // error: field "health" is private
		}
	}

Here, a field marked with `priv` can only be named (and therefore accessed) by the enclosing module or containing modules. It works like every other instance of `priv` in the language: it restricts the use of a name to the enclosing module and its submodules.

It would be an error for modules that aren't the module defining the class or an enclosing module to attempt to construct an instance of a class with a private field with the record literal syntax. This means that, if you use private fields, you need a constructor if you want your class instances to be constructible by the outside world.

## Methods

Naturally, Rust classes support attached methods; this is much of the reason for their existence. But Rust already has a mechanism for creating methods--namely, typeclasses. We could write the above `monster` declaration this way:

    mod A {
	    class monster {
		    priv mut health: int,
		    name: str
	    }

	    impl monster for &monster {
		    fn hit() {
			    self.health -= 10;
		    }
	    }
	}

The trick here is that the typeclass implementation is named `monster`, so a declaration like `import A::monster` will import both the class and the implementation. This entire scenario works because, with privacy restricted to the module, there is no need to place methods inside the class to achieve privacy.

Sometimes, it's useful to have the hidden `self` parameter actually be a GC'd pointer to an instance of the class. In the original class proposal, this is accomplished with a separate type of class named `@class`. However, with this revised proposal, the `@class` functionality falls out naturally, without any extra features:

    class monster {
	    priv mut health: int,
	    name: str,
	    friends: dvec<@monster>  // a dynamic vector
    }

    impl monster for @monster {
	    fn befriend(new_friend: @monster) {
		    new_friend.friends.push(self);
	    }
    }

It'd be best if we could eliminate the repetition of the `monster` name in the `impl` declaration, so I propose inferring it:

    impl for @monster {
	    fn befriend(new_friend: @monster) {
		    new_friend.friends.push(self);
	    }
    }

The name of the implementation would automatically be inferred to be the name of the class if, given a class C, the type is one of `C`, `@C`, `~C`, or `&C`.

Note that, since traits can be applied to implementations, we can apply traits to classes in this way.

It would be ideal to eliminate the `impl` declaration entirely. However, this relies on typeclass coherence, which I'd like to keep separate to avoid coupling proposals. Nevertheless, it's worth mentioning; so, in a forthcoming post, I'll show how typeclass coherence can make method declaration syntax even simpler.

## Destructors

Classes are intended to be the only mechanism for destructors in Rust. Unfortunately, there's no obvious way to eliminate destructors from classes in a minimal way. There are a number of options:

1. Keep destructors in classes, and remove resources.

2. Keep resources around, and remove destructors from classes.

3. Make the destructor interface (`drop`) into a special kind of "intrinsic interface" which enforces *instance coherence*. Then remove both resources and destructors from classes. (Recall that instance coherence means that each class can only have one implementation of an interface, which is clearly, to my mind, a necessity if destructors are to become an interface.)

4. Make *all* interfaces enforce instance coherence, make `drop` into an interface, and remove both resources and destructors from the language.

I prefer option (4), but, as mentioned before, that's a separate issue.

Finally, with nearly all of the special functionality of classes removed, it's worth asking why records continue to exist. Indeed, I've been thinking for a while that structural records should be removed from the language, but the reasons for this tie into a deeper discussion on structural and nominal types and deserve their own blog post.
