---
layout: post
title: "An Overview of Memory Management in Rust"
date: 2013-03-18 15:07
comments: true
categories: 
---

One of the key features of Rust that sets it apart from other new languages is that its memory management is *manual*—the programmer has explicit control over where and how memory is allocated and deallocated. In this regard, Rust is much more like C++ than like Java, Python, or Go, to name a few. This is an important design decision that makes Rust able to function in performance-critical domains that safe languages previously haven't been able to—top-of-the line games and Web browsers, for example—but it adds a nontrivial learning curve to the language.

For programmers familiar with modern C++, this learning curve is much shallower, but for those who are used to other languages, Rust's smart pointers can seem confusing and complex. In keeping with the systems-oriented nature of Rust, this post is designed to explain how Rust's memory management works and how to effectively use it.

## Smart pointers

In many languages with manual memory management, like C, you directly allocate and free memory with calls to special functions. For example:

    void f() {
        int *x = malloc(sizeof(int));  /* allocates space for an int on the heap */
        *x = 1024;                     /* initialize the value */
        printf("%d\n", *x);            /* print it on the screen */
        free(x);                       /* free the memory, returning it to the heap */
    }

C gives you a great deal of control over where memory is allocated and deallocated. Memory is allocated with a special function `malloc`, and it is freed with a special function `free`. After the call to `free`, it is an error to attempt to use `x`, as it is a *dangling pointer*. A dangling pointer points to invalid memory, but the C compiler makes no attempt to prevent you from using it; it's your responsibility to avoid touching it after freeing the memory it points to.

Rust gives you the same level of control over memory, but it works somewhat differently. Let's see how the same piece of code looks in Rust:

    fn f() {
        let x: ~int = ~1024;          // allocate space and initialize an int
                                      // on the heap
        println(fmt!("%d", *x));      // print it on the screen
    } // <-- the memory that x pointed at is automatically freed here

There are three main differences to notice here:

1. In C, you allocate memory first (with the call to `malloc`), and then you initialize it (in the example above, with the `*x = 1024` assignment). Rust fuses the two operations together into the `~` allocation operator, so that you don't accidentally forget to initialize memory before you use it.

2. In C, the call to `malloc` returns a plain pointer, `int *`. In Rust, the `~` operator, which allocates memory, returns a special *smart pointer* to an int. Because this type of smart pointer is so common, its name is just a single character, `~`—thus the type of this smart pointer is written as `~int`.

3. You don't call `free` manually in Rust. Rather, the compiler automatically calls `free` for you when a smart pointer goes out of scope.

As it turns out, points (2) and (3) are very intertwined, and together they form the cornerstone of Rust's memory management system. Here's the idea: Unlike C, allocation functions in Rust don't return a raw pointer to the space they allocate. Instead, they return a *smart pointer* to the space. A smart pointer is a special kind of value that controls when the object is freed. Like a raw pointer in C, you can access the data that a smart pointer refers to with `*`. But unlike a raw pointer, *when the smart pointer to an allocation goes out of scope, that allocation is automatically freed.* In this way, smart pointers are "smart" because they not only track where an object is but also track how to clean it up.

Unlike C, in Rust you never call `free` directly. Instead, you rely on smart pointers to free all allocations. The most basic reason for this is that smart pointers make it harder to forget to free memory. In C, if you forget to call `free`, you have a *memory leak*, which means that the memory will not be cleaned up until the program exits. However, in Rust, the compiler will automatically call `free` for you when the smart pointer pointing to your data goes out of scope.

Rust has multiple types of smart pointers, corresponding to the different strategies that programs use to reclaim memory. Some smart pointers, namely `~` and `@` (which we will cover shortly), have special names known to the compiler, because they're so common. (Having to type long names like `unique_ptr` all the time would be a burden.) Other smart pointers, such as `ARC` (which allows you to share read-only data between threads), are in the standard library and are not built into the compiler.

The pointer covered above is known as the *unique smart pointer* `~`. We call it "unique" because there is always only one smart pointer pointing to each allocation. The other type of smart pointer built into the language is the *managed smart pointer*, which allows *multiple* smart pointers to point to the same allocation and uses *garbage collection* to determine when to free it. Here's an example of a managed smart pointer in use:

    fn foo() {
        let x: @int = @1024;     // allocate space and initialize an int
                                 // on the heap
        bar(x);                  // pass it to `bar`
        println(fmt!("%d", x));  // print it on the screen
    } // <-- the memory can be freed here

    fn bar(x: @int) {
        let y: @int = x;         // make a new smart pointer to `x`
    } // <-- despite `y` going out of scope, the memory is *not* freed here

The key difference between `~` and `@` is that `@` allows *multiple* smart pointers to point to the same data, and the data is cleaned up only after the *last* such smart pointer disappears. Notice that, in this example, the memory pointed at by `y` (which is the same as the memory pointed at by `x`) is not freed at the end of the function `bar`, because `x` is still in use and also points to the same data. The fact that `@` allows multiple smart pointers to the same data, as well as the fact that the allocation is freed only when all of those pointers go out of scope, make managed smart pointers very useful. However, they can be less efficient than unique smart pointers, as they require garbage collection at runtime.

## References

Recall that a smart pointer is a pointer that automatically frees the memory that it points to when it goes out of scope. Perhaps surprisingly, it often turns out that it's useful to have a kind of pointer that *doesn't* free the memory that it points to. Consider this code:

    struct Dog {
        name: ~str    // a unique smart pointer to a string
    }

    fn dogshow() {
        let dogs: [~Dog * 3] = [        // create an array of Dog objects
            ~Dog { name: ~"Spot"   },   // use unique smart pointers to
                                        // allocate
            ~Dog { name: ~"Fido"   },
            ~Dog { name: ~"Snoopy" },
        ];
        for dogs.each |dog| {
            println(fmt!("Say hello to %s", dog.name));
        }
    } // <-- all dogs destroyed here

Suppose that we wanted to single Fido out as the winner of the dog show. We might try this code:

    fn dogshow() {
        let dogs: [~Dog * 3] = [
            ~Dog { name: ~"Spot"   },
            ~Dog { name: ~"Fido"   },
            ~Dog { name: ~"Snoopy" },
        ];
        let winner: ~Dog = dogs[1];
        for dogs.each |dog| {
    	    println(fmt!("Say hello to %s", dog.name));
        }
        println(fmt!("And the winner is: %s!", winner.name));
    } // <-- all dogs, and `winner`, destroyed here

But this code won't compile. The reason is that, if it did, Fido would be destroyed twice. Remember that *unique smart pointers free the allocations they point to when they go out of scope*. The code attempts to make a second smart pointer to Fido at the time it executes the line `let winner: ~Dog = dogs[1];` If the compiler allowed this to proceed, then at the end of the block, the program would attempt to free Fido twice—once when it frees the original smart pointer embedded within the `dogs` array, and once when it frees `winner`.

What we really want is for `winner` to be a pointer that *doesn't* free the allocation that it points to. In fact, what we want isn't a smart pointer at all; we want a *reference*. Here's the code rewritten to use one:

    fn dogshow() {
        let dogs: [~Dog * 3] = [
            ~Dog { name: ~"Spot"   },
            ~Dog { name: ~"Fido"   },
            ~Dog { name: ~"Snoopy" },
        ];
        let winner: &Dog = dogs[1];  // note use of `&` to form a reference
        for dogs.each |dog| {
    	    println(fmt!("Say hello to %s", dog.name));
        }
        println(fmt!("And the winner is: %s!", winner.name));
    } // <-- all dogs destroyed here

This code will now compile. Here, we convert `winner` into a reference, notated in Rust with `&`. You can take a reference to any smart pointer type in Rust by simply assigning it to a value with a reference type, as the `let winner: &Dog = dogs[1]` line does.

References (also known as *borrowed pointers*) don't cause the compiler to free the data they refer to. However, they don't *prevent* the compiler from freeing anything either. They have no effect on what smart pointers will do; regardless of how many references you have, a unique smart pointer will always free the data that it points to when it goes out of scope, and a managed smart pointer will always free its data when all managed smart pointers to the same allocation go out of scope.

This means that you have to be careful with code like this:

    fn foo() {
        let y: &int;
        {
            let x: ~int = ~2048;
            y = x;
        } // <-- x freed here
        println(fmt!("Your lucky number is: %d", *y)); // CRASH: accesses freed data!
    }

In languages like C++, code like this could cause faults from attempting to access invalid memory. As it turns out, however, the Rust compiler can actually prevent you from writing code like this at compile time. Essentially, the Rust compiler *tracks where each reference came from* and reports an error if a reference persists longer than the allocation it points into. This means that, generally speaking, you can use references all you like and have the confidence that they won't result in hard-to-diagnose errors at runtime.

## Conclusion

These ideas—smart pointers and references—form the basis of memory management in Rust. If you're a C++ programmer, most of this will (hopefully!) simply have been an exercise in learning different syntax. For other programmers, these concepts are likely more foreign. But using these tools, you can write code with fine-grained control over memory, with improved safety over languages like C.

