---
layout: post.html
title: "Typestate Is Dead, Long Live Typestate!"
published_date: 2012-12-26 19:54:00 -0800

categories: 
---

One well-known fact about Rust is that the typestate system, which was one of the most unique aspects of the language early on, was dropped in Rust 0.4. The reason was that "in practice, it found little use" (courtesy of Wikipedia), which is fairly accurate. However, what's less well known is that, in the meantime, Rust gained the building blocks necessary for typestate via its uniqueness typing system. With the right patterns, most of the safety guarantees that typestate enabled can be achieved, although it's not as easy to use.

Let's start with the simple example of a file that can be open or closed. We want to ensure at compile time that no methods that require the file to be open (for example, reading) can be called on the file while it is closed. With typestate, we would define the functions as follows:

    use core::libc;

    struct File {
        descriptor: int
    }

    pred is_open(file: File) -> bool {
        return file.descriptor >= 0;
    }

    fn open(path: &str) -> File : is_open {
        let file = File { descriptor: libc::open(path) };
        check is_open(file);
        return file;
    }

    fn close(file: &mut File) {
        libc::close(file.descriptor);
        file.descriptor = -1;
    }

    fn read(file: &File : is_open, buf: &mut [u8], len: uint) {
        libc::read(file.descriptor, ...)
    }

And this is how this module might be used:

    fn main() {
        let file: File : is_open = open("hello.txt");
        read(&file, ...);
        close(file);

        read(&file, ...);    // error: expected File : is_open but found File
        check is_open(file); // will fail at runtime
    }

The constructs here that differ from Rust of today are:

* *Constraints* are special type kinds that can be attached to types with the `:` syntax; e.g. `File : is_open`.

* The `pred` keyword declares a *predicate* function, which defines both a function and a constraint.

* All values have unconstrained types when initially constructed. To add a constraint to a type, we use the `check` keyword. The `check` expression evaluates a predicate and fails at runtime if the predicate returns `false`; otherwise, it adds the appropriate constraint to the type of the predicate's argument.

Now let's look at how we could achieve this in current Rust. We use the *branding pattern*:

    struct File<State> {
        priv descriptor: int,
    }

    // Make the type noncopyable.
    impl<T> File<T> : Drop {
        fn finalize(&self) {}
    }

    struct Open(@Open);
    struct Closed(@Closed);

    fn check_open<T>(file: File<T>) -> File<Open> {
        assert file.descriptor >= 0;
        let new_file: File<Open> = File {
            descriptor: file.descriptor
        };
        return new_file;
    }

    fn open(path: &str) -> File<Open> {
        let file: File<Closed> = File { descriptor: libc::open(path) };
        let file: File<Open> = check_open(file);
        return file;
    }

    fn close<T>(file: File<T>) -> File<Closed> {
        let new_file: File<Closed> = File {
            descriptor: -1
        };
        libc::close(file.descriptor);
        return new_file;
    }

    fn read(file: &File<Open>, buf: &mut [u8], len: uint) {
        libc::read(file.descriptor, ...)
    }

Using this code has a different feel to it:

    fn main() {
	    let file: File<Open> = open("hello.txt");
	    read(&file, ...);
	    let file: File<Closed> = close(file);

	    read(&file, ...);  // error: expected File<Open> but found File<Closed>
	    let file: File<Open> = check_open(file); // will fail at runtime
    }

The differences between this code and the original code using typestate are:

* Rather than directly altering the constraints attached to a value's type, the functions that change typestate take a value of one type and return a different value of a different type. For example, `close()` takes a value of `File<T>` for any state `T` and returns a value of type `File<Closed>`.

* Instead of the built-in notion of a predicate, this code uses a *phantom type*. A phantom type is a type for which no values can be constructed—in this example, there is no way to construct a value of type `Open` or `Closed`. Instead, these types are solely used as "markers". In the code above, a value of type `File<Open>` represents an open file, and a value of type `File<Closed>` represents a closed file. We call these *branded types*, because `File` is *branded* with the `Open` or `Closed` status. Generics (e.g. `File<T>`) can be used when the state of a file is irrelevant; e.g. if a function can operate on both closed or open files.

* `File` instances are made noncopyable. This is important to prevent code like this from compiling:

      let file: File<Open> = open("hello.txt");
	  let _: File<Closed> = close(file); // ignore the return value
      read(&file, ...);  // error: use of moved value `file`

The important idea is that to get a closed file, you must first surrender your open file. The uniqueness system in Rust allows the compiler to ensure this: when you change typestates, you must move your original value away, and the compiler will ensure that you can't access it again.

* The file descriptor field is made private to the containing module. This is important to disallow other modules from forging open or closed `File` instances. Otherwise, other code could simply convert an open file to a closed file the same way `check_open` does:

      let open_file: File<Open> = open("hello.txt");
	  let closed_file: File<Closed> = close(open_file);
	  let fake_open_file: File<Open> = File { descriptor: closed_file };
	  // ^^^ error: use of private field 'descriptor'
	  read(&fake_open_file, ...);

Since the `File` structure contains a private field, no code other than the containing module can create one. In this way, we ensure that nobody can forge instances of `File` and violate our invariants.

Now, it's obvious that this isn't perfect in terms of usability. For one, it's a design pattern, and design patterns are the sincerest form of request for syntax. I'm not particularly concerned about this aspect, however, because syntactic sugar is readily achievable with macros.

The issue that I'm concerned with is deeper. One nice thing about typestate as previously implemented is that you don't have to surrender your value; you can effectively "mutate" its type "in-place". This saves you from writing temporary variables all over the place and also saves some (cheap) copies at runtime. For example, you can write:

    let file = open("hello.txt");
    read(&file, ...);
    close(file);

Instead of:

    let file = open("hello.txt");
    read(&file, ...);
    let file = close(file);

In Rust, however, this causes complications, which we never fully resolved. (In fact, this is part of what led to typestate's removal.) Suppose that `close` mutated the type of its argument to change it from `&File<Open>` to `&File<Closed>`. Then consider the following code:

    trait Foo {
	    fn speak(&self);
    }

    impl File<Open> : Foo {
	    fn speak(&self) {
		    io::println("woof");
		}
    }

    trait Bar {
	    fn speak(&self, x: int);
    }

    impl File<Closed> : Bar {
	    fn speak(&self) {
		    io::println("meow");
		}
	}
	
    let file = open("hello.txt");
    for 5.times {
        file.speak();
        close(&file);
    }

How do we compile this code? The first time around the `for 5.times { ... }` loop, `file.speak()` should resolve to `Foo::speak`; the second time around, `file.speak()` should resolve to `Bar::speak`. Needless to say, this makes compiling extremely difficult: we would have to consider the lexical scope of every single method invocation and compile it for *each* possible predicate!

Because of these and other complications, mutating the type doesn't seem possible in the general case. We would certainly need to introduce some set of restrictions—perhaps we would need to formalize the notion of a "constraint" in the type system (probably by introducing a new type kind) and then introduce some restrictions on implementation declarations to prevent instances from depending on constraints. Whatever system we come up would be pretty complex and would require a fair bit of thought to get right.

So I'd like to try to play with the current setup and see how far we get with it. In future versions of the language (post-1.0), it might be worthwhile to try to allow some sort of in-place "mutation" of types, similar to languages with true typestate. Overall, though, the combination of uniqueness and branding places today's Rust in an interesting position, supporting much of the power that came with typestate in a simple system.

