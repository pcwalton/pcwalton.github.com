---
layout: post
title: "The New Borrow Check in a Nutshell"
date: 2013-01-21 17:56
comments: true
categories: 
---
The New Borrow Check in a Nutshell
----------------------------------

If you've used Rust for any period of time, you've probably been bitten by the mysterious *borrow check*—the compiler pass responsible for preventing [iterator invalidation], as well as a few other dangling pointer scenarios. The current iteration of the borrow check enforces a fairly complex set of rules. Because the rules were hard to understand and ruled out too many valid programs, we were never really satisfied with the analysis; without a simple set of rules to follow, programmers will get frustrated and give up. To remedy this, Niko has proposed a [revamp] of the borrow checker known as "Imagine Never Hearing the Phrase 'Aliasable, Mutable' Again". This has mostly been implemented in [a pull request] now, so I'd like to take the opportunity to explain the new rules. I'm particularly excited about this change because now the entire set of borrow check rules are simple enough to boil down to one principle.

Here's the rule that the new borrow check is in charge of enforcing: *Whenever you take a pointer to an object, you may not modify that object as long as that pointer exists, except through that pointer.*

(Strictly speaking, this is not all the new borrow check enforces, but the other errors the pass can produce are generally straightforward and simple dangling pointer errors. Also, I'm omitting the rules related to `&const`, as this rarely-used type of pointer is likely to be removed.)

For unique pointers (`~`) and borrowed pointers (`&`), this rule is enforced at compile time, without any runtime overhead. Here's an example:

    let mut the_magic_word = Some(~"zap");
    match the_magic_word {
        None => {}
        Some(ref word) {
            the_magic_word = None; // ERROR
            io::println(*word);
        }
    }

Here, the line marked `ERROR` produces the error "assigning to mutable local variable prohibited due to outstanding loan". This happens because we violated the rule above—the line `the_magic_word = None` mutates the value `the_magic_word` while there exists a pointer to it (`word`).

Another example:

    struct Foo {
        array: ~[int]
    }

    impl Foo {
        fn bar(&mut self) {
            for self.array.each |i| {
                self.array = ~[];  // ERROR
                io::println(i.to_str());
            }
        }
    }

Again, the error is "assigning to mutable field prohibited due to outstanding loan". As before, it's traceable to a violation of the mutation rule: the line `self.array = ~[]` mutates the `self.array` field while a pointer (`i`) into it exists.

This example is interesting for a couple of reasons. First of all, it directly corresponds to C++ iterator invalidation: here, the Rust compiler is able to detect that the `i` iterator, which has type `&int`, was invalidated without any runtime overhead. Second, this example illustrates something that was not possible under the previous borrow check regime: borrowing a field accessible through a `&mut` pointer (the self pointer) as immutable. More than any other, this restriction probably led to the greatest number of borrow check errors in practice, since it prevented iterating over any collections reachable from `&mut` pointers.

Now all of this works fine for `&` and `~` pointers, but what about managed boxes (`@`)? It turns out that immutable `@` boxes are easy to deal with; since they can't be mutated at all, the borrow checker doesn't have to do anything to enforce the no-mutation rule. However, for `@mut` boxes, the situation is more complicated. Here, the new borrow checker resorts to *runtime* checks to enforce the pointer rules—attempting to mutate an `@mut` box while a pointer to its contents exists results in task failure at runtime, unless the mutation is done through that pointer.

Interestingly, this is similar to the way various debug or safe STL implementations (for example, Microsoft's) guard against iterator invalidation. The differences are: (1) in Rust, the checks are automatically inserted by the compiler instead of built into each collection by hand; and (2) the checks are only needed for garbage collected data, as the compiler can perform the checks at compile time for other types of data.

There is one gotcha here, however. As implemented, if any pointer exists to *any* part of an `@mut` box, then the *entire* box cannot be mutated while that pointer exists. This means that this example will fail:

    struct Dungeon {
	    monsters: ~[Monster],
	    total_gold: int
    }

    impl Dungeon {
	    fn count_gold(@mut self) { // note `@mut self`, not `&mut self`
		    self.total_gold = 0;
		    for self.monsters.each |monster| { // pointer created here
			    self.total_gold += monster.gold;
		    }
		}
	}

Note that the iterator variable `monster` has type `&Monster`. This is a pointer to the inside of `Dungeon`, so the assignment to `self.total_gold` violates the mutation rule. Unfortunately, the compiler does not currently catch this, so the program will fail at runtime.

There are a couple of workarounds. The simplest way is to change `@mut self` to `&mut self`. Since there is no need to give out the `@mut` pointer for this operation, this is safe. Roughly speaking, the compile-time checks operate on a per-field basis, while the runtime checks operate on a per-box basis. So this change makes the operation succeed. Another possibility is to make `total_gold` into a local variable and assign to the field after the `for` loop.

Despite the fact that this error is easy to fix, I'm concerned about the fact that the compiler won't catch this kind of thing at compile time. So I think we should introduce a set of warnings that looks for common violations of this rule. It's impossible to make the warnings catch *all* failures—that's the reason why the check is done at runtime in the first place. (In general, trying to make the compiler reason about `@` boxes is hard, since the compiler has no idea how many references to them exist.) But I suspect that we could make the analysis good enough to catch the majority of these errors in practice.

In any case, the take-away from all of this is that the borrow checker should be much easier and more transparent with this change. There's essentially just one straightforward rule to remember.

[iterator invalidation]: http://stackoverflow.com/questions/6438086/iterator-invalidation-rules
[revamp]: http://smallcultfollowing.com/babysteps/blog/2012/11/18/imagine-never-hearing-the-phrase-aliasable/
[a pull request]: https://github.com/mozilla/rust/pull/4454
