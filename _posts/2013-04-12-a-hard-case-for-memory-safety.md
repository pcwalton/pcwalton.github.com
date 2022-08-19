---
layout: post.html
title: "A Hard Case for Memory Safety"
published_date: 2013-04-12 14:01:00 -0800

categories: 
---

Quick quiz: In this C++ program, is the definition of `munge` guaranteed to be memory safe? (Assume that the definition of `increment_counter` uses only modern C++ idioms and doesn't do anything like dereference an invalid pointer.)

    #include <iostream>
    #include <vector>

    class foo {
    public:
        std::vector<int> indices;
        int counter;
        
        foo() : indices(), counter(0) {
            indices.push_back(1);
            indices.push_back(2);
            indices.push_back(3);
        }
        
        void increment_counter();
        
        int &get_first_index() {
            assert(indices.size() > 0);
            return indices[0];
        }
        
        void munge() {
            int &first = get_first_index();
            increment_counter();
            std::cout << first << std::endl;
            first = 20;
        }
    };

    int main() {
        foo foo;
        foo.munge();
        return 0;
    }

The answer: Even with this caveat, we can't tell! It depends on the definition of `increment_counter`.

If `increment_counter` has this definition, the code is memory safe:

    void foo::increment_counter() {
        counter++;
    }

But if `increment_counter` has this definition, for example, then it isn't:

    void foo::increment_counter() {
        indices.clear();
        counter++;
    }

This definition would cause the `first` reference in `munge` to become a dangling reference, and the call to `std::cout` and subsequent assignment of `first` will have undefined behavior. If `first` were not an `int` but were instead an instance of a class, and `munge` attempted to perform a virtual method call on it, then this would constitute a critical security vulnerability.

The point here is that determining memory safety in C++ requires *non-local* reasoning. Any analysis that tries to determine safety of C++ code, whether performed by a machine or performed by a human auditor, has to analyze many functions all at once, rather than one function at a time, to determine whether the code is memory safe. As this example illustrates, sticking to modern C++ coding styles, even with bounds checks, is not enough to prevent this.

There are a few ways around this:

* For each function call, analyze the source to the called function to determine whether it's memory safe *in the context of the caller*. This doesn't always work, though: it's hard or impossible when function pointers or virtual methods are involved (which function ends up being called?), and it's hard with separately compiled code (what if the called function is in a DLL that you don't have source for?)

* Change the type of `indices` to `std::vector<std::shared_ptr<int>>`; i.e. use reference counting to keep the pointer alive. This has a runtime cost.

* Inline the body of `increment_counter`, so that the memory safety of `munge` is immediately clear.

* Make `increment_counter` a class method (or just a function) instead of an instance method, and have it take `counter` by reference. The idea here is to prevent the possibility that `increment_counter` could mess with `indices` in any way by shutting off its access to it.

What does this have to do with Rust? In fact, this error corresponds to a borrow check error that Brian Anderson hit when working on the scheduler. In Rust, the corresponding code looks something like this:

    impl Foo {
        fn get_first_index(&'a mut self) -> &'a mut int {
            assert!(self.indices.len() > 0);
            return &mut indices[0];
        }

        fn munge(&mut self) {
            let first = self.get_first_index();
            self.increment_counter(); // ERROR
            println(first.to_str());
            *first = 20;
        }
    }

This causes a borrow check error because the `first` reference conflicts with the call to `increment_counter`. The reason the borrow check complains is that the borrow check only checks one function at a time, and it could tell (quite rightly!) that the call to `increment_counter` might be unsafe. The solution is to make `increment_counter` a static method that only has access to counter; i.e. to rewrite the `self.increment_counter()` line as follows:

    Foo::increment_counter(&mut self.counter);

Since the borrow check now sees that `increment_counter` couldn't possibly destroy the `first` reference, it now accepts the code.

Fortunately, such borrow check errors are not as common anymore, with the new simpler borrow check rules. But it's interesting to see that, when they do come up, they're warning about real problems that affect any language with manual memory management. In the C++ code above, most programmers probably wouldn't notice the fact that the memory safety of `munge` depends on the definition of `increment_counter`. The challenge in Rust, then, will be to make the error messages comprehensible enough to allow programmers to understand what the borrow checker is warning about and how to fix any problems that arise.
