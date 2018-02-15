---
layout: post
title: "Unique Pointers Aren't Just About Memory Management"
date: 2012-10-03 11:32
comments: true
categories: 
---

One of the most unusual features of Rust, especially when compared to languages that aren't C++, is the three types of pointers: *borrowed* pointers (`&T`), *unique* pointers (`~T`), and *managed* pointers (`@T`). Most people quite rightly ask "why three pointers? Isn't one enough?" The usual answer is that unique pointers help with manual memory management:

* Managed pointers (`@T`) allow convenient garbage collection.

* Unique pointers (`~T`) work like `malloc` and `free` from C to allow programmers who don't want the overhead and complexity of GC to avoid it.

* Borrowed pointers (`&T`) allow functions to work equally well with both unique and managed pointers.

This is all true, but there's another, equally important reason that's often overlooked: unique pointers allow for efficient, safe concurrency.

To see why, let's consider the possible ways that an actor- or CSP-based system could enforce safe message passing. By *safe* message passing I mean that actors can't create data races by simultaneously accessing shared mutable data. In short, we want to enforce that this adage is followed (courtesy of Rob Pike)--"do not communicate by sharing memory; share memory by communicating."

There are three simple ways to do this:

1. Copy all messages sent from actor to actor. Changes that one actor makes to the contents of any message do not affect the other actors' copies of the message.

2. Require that all messages sent from actor to actor be immutable. No actor may make changes to any message after it's created.

3. Make messages inaccessible to the sender once sent--senders "give away" their messages. Only one actor may mutate a message at any given time.

Each of these patterns has advantages and disadvantages:

1. Copying all messages has the advantage that it's simple to reason about, and the programmer doesn't have to worry about mutability restrictions. The disadvantage is that it comes with a significant performance cost, both in terms of allocation overhead and the copying itself.

2. Requiring that messages be immutable has the advantage that many messages can be efficiently sent, but it still can lead to copying in many cases. Consider, for example, an application that spawns off a task to decode a large JPEG image. To be efficient, the image decoding algorithm generally wants to decode into a mutable buffer. But the decoded image data must be immutable to be sent, which necessitates a potentially-expensive copy of the pixel data out of the work buffer to an immutable location.

3. Making messages inaccessible to the sender has the advantage that it's simple and fast, but it has the disadvantage that it could lead to copying if both the sender and receiver need to access the memory after the send operation.

Because one pattern rarely fits every use case, most actor-based languages, including Rust, have varying levels of support for all three of these patterns (and for more complex patterns that don't appear in the above list, such as [software transactional memory](http://en.wikipedia.org/wiki/Software_transactional_memory)). However, each language tends to favor one of the three patterns "by default". For example, Erlang leans toward option #1 (copying all messages), Clojure leans toward option #2 (immutable sharing), while Rust leans toward option #3 (giving messages away). The important thing to note here is that all of the patterns have advantages and disadvantages, and so different scenarios will call for one or the other. Consider the image decoding example from before; pattern #3 is by far the most efficient way to handle this, as the buffer needs to be mutable while the image decoder works on it, but the decoder has no need for the image after decoding is done.

Now the simplest way to support pattern #3 *safely*--in other words, to enforce *at compile time* that only one actor can hold onto a message at any given time--is through unique pointers. The compiler guarantees that only one reference exists to a uniquely-owned object, enforcing the property we want. Unique pointers support a *move* operation, which allows functions to "give a pointer away" to another function. So by simply requiring that the "send" method takes a unique pointer and moves its argument, we teach the compiler everything it needs to know to enforce safe concurrency.

In this way, unique pointers aren't just a tool for manual memory management. They're also a powerful tool for eliminating data races at compile time. The fact that they also allow Rust programs to avoid the garbage collector is just an added bonus.
