---
layout: post.html
title: "Coherence, modularity, and extensibility for typeclasses"
published_date: 2012-05-28 22:12:00 -0800

categories: 
---

I've been experimenting with the design of a modification to Rust typeclasses. Because it's always best to start with code, here's a synopsis of what I have in mind:

    mod A {
        // Declaration of an interface:
        iface to_str {
            fn to_str() -> str;
        
            // Implementations for various types:

            impl int {
                fn to_str() -> str {
                    ... implementation of to_str on ints ...
                }
            }
        
            impl uint {
                fn to_str() -> str {
                    ... implementation of to_str on unsigned ints ...
                }
            }
        
            ... more types here ...
        }

        // Define a class and declare that it implements to_str:
        class foo : to_str {
            fn to_str() {
                ret "foo";
            }
        }
    }

    mod B {
        import A::to_str;    // Must import the interface first, so
                             // that the compiler can find the method
                             // "to_str".

        println(3.to_str()); // Calls the "to_str" defined above.
    }
    
    mod C {
        let x = A::foo();    // Creates a foo object named "x".

        x.to_str();          // Calls "to_str" on "x". Note that I
                             // didn't have to import the "to_str"
                             // method in this scope—since it was
                             // defined inside the declaration of the
                             // class "foo", it's obvious what the
                             // implementation is.
    } 

Essentially, the implementations of an interface go *inside* the declaration of the interface, with one significant exception: a class is permitted to define implementations of interfaces in the body of the class. The compiler prohibits multiple implementations of the same interface on the same type using two simple rules: (1) implementations defined within an interface must be non-overlapping (i.e. there can't be any types which match multiple implementations); and (2) a class can't implement an interface that already defines an implementation which might itself match an instance of that class.

The fact that the implementations go inside the interface is a little strange—it resembles the proposed Java defender methods, although it's used for a completely different purpose—but I believe there is an important reason for it. It means that, if a programmer wants to look up the definition of a method call, he or she can simply figure out which interface it belongs to, which must always be in scope via an `import` statement, and then look at the declaration of the interface to find the method.

Fundamentally, the guiding principles behind this design are that the typeclass system should be *coherent* and *modular* while supporting *extensibility*. Here are the definitions of these terms as I see them:

*Coherent* — A typeclass system is coherent if there exists at most one implementation of an interface for every type. Typeclass systems that don't have this property have the *instance coherence* problem (or, as we called it when we independently stumbled across it, the "hash table problem".)

*Modular* — A typeclass system is modular if the unit in the source code that carries the implementation for every method must be in the lexical scope of every call site that needs the implementation (or, for nominal types only, in the lexical scope of the declaration of the type). This is a little unclear, so some examples are in order. First, a simple one:

    import vec::len;
    printf("The length is %u", [ 1, 2, 3 ].len());
    
In this example, we need the implementation for `len` in scope in order to make a direct call to the method `len`.

Now a more complex example:

    fn print_length<T:len>(x: T) {
        printf("The length is %u", x.len());
    }
    
    import vec::len;
    print_length([ 1, 2, 3 ]);
    
Here, we need the definition of `len` in scope at the time we call `print_length`. Because `print_length` can print the length of any value that implements the `len` interface, it doesn't intrinsically know which method to call. This information has to be provided by the caller of `print_length`. For this reason, the call to `print_length` requires the implementation `vec::len` to be in scope.

In typeclass systems that aren't modular, modules that define conflicting typeclass implementations usually can't be linked together. For instance, in such a system, if module `A` implements `len` for vectors and module `B` independently implements `len` for vectors, then modules A and B can't be used together in the same program. Obviously, this poses a hazard for large systems composed of many independently developed submodules.

*Extensibility* — A typeclass system facilitates extensibility if it's possible for the programmer to introduce a new interface and provide implementations of that interface for existing types in the system. This is what makes typeclasses act like object extensions; it's also what makes user-defined typeclasses useful on primitive types.

Many languages have typeclass or interface systems, but to my knowledge none of the mainstream systems support all three of these features. For example:

*C++*—C++ concepts support extensibility, but aren't coherent and are only somewhat modular. The C++ language permits out-of-line definition of custom operations on class and enum types. As an example, to provide an ordering on vectors of integers:

    #include <vector>
    bool operator<(std::vector<int> &a, std::vector<int> &b) {
        ...
    }

In this way, C++ concepts are extensible. But there's no check to ensure that there is only such definition in the program for each data type, so C++ concepts aren't coherent. In this example, other namespaces can define `operator<` over the same types.

Generally, C++ scoping rules ensure that a function can never be called outside of its lexical scope. But there is a significant exception: argument-dependent lookup. With ADL, a function can be called outside of its lexical scope if that function was defined in the same scope as the type of one of its arguments. This feature was intended for extensibility, as it allows collections like `std::map` to pick up definitions of functions like `operator<` even if the functions aren't in scope. However, it clearly comes at the cost of modularity.

*Haskell*—Haskell typeclasses are coherent and support extensibility, but aren't modular. Haskell programmers can define instances of typeclasses for any type in the system, but there can be only one instance of a typeclass for every type in the program. This can cause problems when two modules are linked together—if, say, module A defines `Show` of `int` and module B independently defines `Show` of `int`, modules A and B can't be linked together.

*Java* and *Go*—Java interfaces are modular and coherent, but aren't extensible. In Java, an implementation of an interface can be defined only within the package that declares the type. This means, in particular, that interfaces can't be defined on primitive types. It also means that a module can't define an interface and then declare an implementation of the interface on existing types without modifying the existing type. Go interfaces have the same limitations (unless you define an interface over methods that are already defined on the type in question).

*Scala*—Scala interfaces are modular but only mostly coherent; they also offer some support for extensibility. Unsurprisingly, interfaces in Scala are basically the same as interfaces in Java. The major difference is that, unlike Java, Scala provides a mechanism for extending classes with implementations of interfaces without having to modify the definition of the class—namely, implicits. This feature is extremely useful for extensibility; it also solves the problem of methods on primitive types in an elegant way. The trouble is that implicits are somewhat inconvenient to use; the programmer must define an implicit wrapper around the object, so the `this` parameter won't refer to the object itself but rather to the wrapper. Equally importantly, implicits don't enforce coherence—two modules can define two different implicits on the same type.

*Objective-C*—Objective-C categories support extensibility, but aren't modular or coherent. In Objective-C, methods can be added to existing objects by defining a new category for that object and placing the methods within that category. The problems with categories are that method calls are all late-bound (precluding static scoping), and what happens when two modules that define conflicting category implementations are linked together is *undefined*: the resulting object might provide one implementation, or it might provide the other implementation. Either way, the resulting program is unlikely to work.

*Current Rust*—The current Rust implementation of typeclasses is modular and supports extensibility, but it doesn't maintain coherence. Implementations are separate from interfaces in Rust (except for classes), and interfaces and implementations can both be defined over primitive types. The trouble is that there can be multiple conflicting implementations for typeclasses, which can lead to the instance coherence problem.

So how does this proposed design compare?

* It offers coherence because there can be only one implementation of an interface for each type. For the implementations provided within the interface itself, we can check that they're nonoverlapping. For the implementations defined with classes, we can check to ensure that the interface implementations don't overlap with the implementations that the interface itself defined. Either way, the checks involved are simple and ensure that we meet the criterion for coherence.

* It offers modularity because the implementation either has to be imported as part of the interface (for implementations defined inside interfaces) or part of the nominal type (for class implementations). Consequently, it is never the case that two Rust crates cannot be linked together because of conflicting typeclass implementations.

* It offers extensibility because, when an interface is defined, implementations can be provided for any existing types without modifying the declarations of those types.

Finally, it supports all three of these features while maintaining a minimal feature set.
