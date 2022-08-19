---
layout: post.html
title: "Which Pointer Should I Use?"
published_date: 2013-03-09 12:05:00 -0800

categories: 
---

Deciding whether to use a managed `@` pointer or an owned `~` pointer to allocate memory is one of the most frequent sources of confusion for newcomers to Rust. There are two main angles to consider when deciding whether to use an `@` pointer or a `~` pointer in Rust: *memory management* and *concurrency*. I'll cover each in turn.

Note that this tutorial only presents the basic system. There are many extensions to the system—borrowing, library smart pointers, cells, and so on—that allow the various limitations described here to be overcome. But this is the core system that needs to be understood first.

# Memory management

One of the most important features of Rust from a systems programming perspective is that garbage collection is optional. What this means is that there are safe ways to allocate memory that do not require bookkeeping at runtime to determine when it is safe to free that memory.

What makes it possible for Rust programs to avoid runtime garbage collection is the notion of *ownership* of a particular allocation. Under this scheme, when the single owner of an allocation goes out of scope, the allocation is freed. Owned pointers in Rust are notated with `~`. Here's an example of their use:

    struct Point {
	    x: int,
        y: int,
    }

    fn f() {
        let x: ~Point = ~Point { x: 10, y: 20 };  // allocate a Point on the heap
    }  // <-- x is freed here

Here, `x` is the single owner of the `Point` on the heap. Because there is only a single owner, Rust can throw away the memory pointed to by `x` at the end of the function.

The compiler enforces that there is only a single owner. Assigning the pointer to a new location *transfers ownership* (known as a *move* for short). Consider this program:

    fn g() {
	    let a: ~Point = ~Point { x: 10, y: 20 }; // allocate a Point on the heap
	    let b = a;                               // now b is the owner
	    println(b.x.to_str());                   // OK
	    println(a.x.to_str());                   // ERROR: use of moved value
    } // <-- b is freed here

When compiling this program, the compiler produces the error "use of moved value". This is because assigning an owned pointer transfers ownership, making the old variable *dead*. Because the compiler knows precisely which variables are dead at all times, it can avoid having to determine at runtime whether to free the memory that a variable points to, and it can prevent you from accidentally accessing dead variables. However, this comes at a price: you are limited to using a single variable to refer to an `~` allocation.

By contrast, `@` pointers do not have this limitation. We think of memory that is allocated with `@` as *owned by the garbage collector*. You can make as many pointers to `@` memory as you would like. There is a cost in runtime performance, but this cost comes with a great deal of flexibility. For example, the code above will compile with an `@` pointer:

    fn h() {
        let a: @Point = @Point { x: 10, y: 20 }; // allocate a Point on the heap
        let b = a;                               // a and b share a reference
        println(b.x.to_str());                   // OK
        println(a.x.to_str());                   // also OK
    }

So, in short: *`@` pointers require garbage collection, but allow multiple pointers to the same location. `~` pointers avoid this GC overhead, but they don't allow multiple pointers to the same location.*

# Concurrency

Another equally important aspect to the distinction between `@` and `~` is that it ensures that concurrent Rust tasks don't race on shared memory. To illustrate this, here's an example of broken code that doesn't compile:

    struct Counter {
	    count: int
    }

    fn f() {
	    // Allocate a mutable counter.
	    let counter: @mut Counter = @mut Counter { count: 0 };
		do spawn {               // spawn a new thread
			// Increment the counter.
			counter.count += 1;  // ERROR: attempt to capture an `@` value
	    }
	    println(counter.count.to_str()); // print the value
    }

This code contains a classic *race*—if this code compiled, then the value printed would be either 0 or 1, depending on whether the `counter.count += 1` line executed first or the `println` executed first. The key here is that two threads—the spawned thread and the main thread—are both simultaneously attempting to access the `counter` object. To prevent these errors, Rust prevents multiple threads from accessing the same memory at the same time.

Recall from the previous section that there can be any number of pointers to memory allocated with `@`. But there can be only one pointer to memory allocated with `~`. This suggests a way to forbid multiple threads from accessing the same data: *restrict the types of pointers that can be sent between threads to `~` pointers*. And this is exactly what Rust does.

For any piece of `~`-allocated memory, there is only one pointer to it, and that pointer is owned by exactly one thread. So there can be no races, since any other threads simply don't have access to that memory. Let's rewrite our example above using `~` to illustrate this:

    fn g() {
	    // Allocate a mutable counter.
	    let mut counter: ~Counter = ~Counter { count: 0 };
	    do spawn {               // spawn a new thread
		    counter.count += 1;  // increment the counter
		}
		println(counter.count.to_str()); // ERROR: use of moved value
	}

What's going on here is that, by referring to `counter` inside the `spawn` block, the new thread *takes ownership* of the `counter` variable, and the `counter` variable becomes dead everywhere outside that block. Essentially, the main thread loses access to `counter` by *giving it away* to the thread it spawns. So the attempt to print the value on the screen from the main thread will fail. By contrast, this code will work:

    fn h() {
        // Allocate a mutable counter.
        let mut counter: ~Counter = ~Counter { count: 0 };
        do spawn {               // spawn a new thread
	        counter.count += 1;  // increment the counter
	        println(counter.count.to_str()); // OK: `counter` is owned by this thread
        }
    }

Notice that the data race is gone: this code always prints `1`, because the printing happens in the thread that owns the `Counter` object.

The resulting rule is pretty simple. In short: *`@` pointers may not be sent from thread to thread. `~` pointers may be sent, and are owned by exactly one thread at a time.* Therefore, if you need data to be sent, do not allocate it with `@`.

# Conclusion (TL;DR)

So the distinction between `@` and `~` is often confusing to newcomers, but it's really quite simple. There are two main rules to remember:

1. `~` only supports one pointer to each allocation, so if you need multiple pointers to the same data, use `@`. But `@` requires garbage collection overhead, so if this is important to your application, use `~` wherever possible.

2. Don't use `@` pointers if you need to send data between multiple threads. Use `~` instead.

Finally, I should note again that, if these rules are too restrictive for you (for example, if you need multiple pointers but can't tolerate garbage collection pauses), there are more advanced solutions: borrowing, safe smart pointers, and unsafe code. But this simple system works well for many programs and forms the foundation of Rust's approach to memory management.
