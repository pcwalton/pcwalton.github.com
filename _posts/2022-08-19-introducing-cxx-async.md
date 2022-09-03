---
layout: post.html
title: "Introducing `cxx-async`"
published_date: 2022-08-19 14:01:00 -0800
excerpt: "
I'm happy to announce a new Rust crate that I've been working on for a while at Meta: `cxx-async`. `cxx-async` is an extension to the `cxx` crate that allows for bidirectional interoperability between C++ coroutines and asynchronous Rust functions. With it, you can `await` C++ coroutines and `co_await` Rust functions; as much as possible, everything \"just works\". The biggest practical benefit of C++ coroutine interoperability is *elimination of awkward callback patterns when interfacing with C++*.
"

categories:
---

I'm happy to announce a new Rust crate that I've been working on for a while at Meta: [`cxx-async`]. `cxx-async` is an extension to the [`cxx`] crate that allows for bidirectional interoperability between C++ coroutines and asynchronous Rust functions. With it, you can `await` C++ coroutines and `co_await` Rust functions; as much as possible, everything "just works". The biggest practical benefit of C++ coroutine interoperability is *elimination of awkward callback patterns when interfacing with C++*.

Let's build a simple service to demonstrate this. Suppose we want to build a Rust service that uses the C `stb_image` and `stb_image_write` libraries to convert JPEG images to PNG[^1]. (Note: Don't expose the `stb_image` libraries to untrusted input in a real application, as they aren't designed to be secure. They just have a simple API that's good for demonstration.) We might use the Tokio libraries to make a service like this:

```rust
use actix_web::{get, App, HttpServer, Responder};
use std::future::Future;
use std::io::Result as IoResult;

// The server entry point.
#[actix_web::main]
async fn main() -> IoResult<()> {
    HttpServer::new(|| App::new().service(convert))
        .bind(("127.0.0.1", 8765))?
        .run()
        .await
}
```

On the C++ side, we might wrap the `stb_image` libraries like so:

```cpp
#define STB_IMAGE_WRITE_IMPLEMENTATION

#include "coroutine_example.h"
#include "stb_image.h"
#include "stb_image_write.h"
#include <cstdint>
#include <sys/types.h>
#include <sys/uio.h>
#include <unistd.h>

// Synchronously reencodes a JPEG to PNG.
rust::Vec<uint8_t> reencode_jpeg(rust::Slice<const uint8_t> jpeg_data)
{
    // Load the JPEG image.
    int width, height, channels;
    uint8_t *pixels = stbi_load_from_memory(
        jpeg_data.data(), jpeg_data.size(), &width, &height, &channels, 4);
    if (pixels == nullptr)
        throw std::runtime_error("Failed to load image!");

    // Write the PNG to a temporary file.
    // `stb_image_write` doesn't support writing directly to an in-memory buffer, so we have to go
    // through a file first.
    char tmpPath[32] = "/tmp/imageXXXXXX";
    int fd = mkstemp(tmpPath);
    if (fd < 0)
        throw std::runtime_error("Couldn't create temporary file!");
    int ok = stbi_write_png(tmpPath, width, height, 4, pixels, width * 4);
    if (ok == 0)
        throw std::runtime_error("Couldn't reencode image!");

    // Read that temporary file back to memory.
    rust::Vec<uint8_t> encodedPNG;
    uint8_t buffer[4096];
    size_t nRead;
    while ((nRead = read(fd, buffer, sizeof(buffer))) > 0)
        std::copy(&buffer[0], &buffer[nRead], std::back_inserter(encodedPNG));
    if (nRead < 0)
        throw std::runtime_error("Failed to reread written image file to memory!");

    // Clean up and return the decoded PNG to Rust.
    close(fd);
    unlink(tmpPath);

    return encodedPNG;
}
```

And then declare the `cxx` bridge to connect the Rust and C++ together:

```rust
#[cxx::bridge]
mod ffi {
    unsafe extern "C++" {
        include!("coroutine_example.h");
        fn reencode_jpeg(jpeg_data: &[u8]) -> Vec<u8>;
    }
}
```

And the REST service endpoint:

```rust
#[post("/convert")]
async fn convert(jpeg_data: Bytes) -> impl Responder {
    ffi::reencode_jpeg(&jpeg_data)
}
```

After starting the server with `cargo run`, we can verify that this all works:

```sh
$ curl --data-binary @ferris.jpg -H "Content-Type: image/jpeg" --output out.png http://127.0.0.1:8765/convert
$ file out.png
out.png: PNG image data, 275 x 183, 8-bit/color RGBA, non-interlaced
```

So we have a working service, but it has scalability problems. We're doing the one thing you should never do when working with async I/O: blocking the event loop with a long-running computation. Let's use a thread pool on the C++ side[^1] to fix this problem. Using the [`boost::asio::thread_pool` type] from Boost, we can rewrite the C++ side to look like this:

```cpp
...
#include <boost/asio/post.hpp>
#include <boost/asio/thread_pool.hpp>
...

boost::asio::thread_pool g_thread_pool(8);

rust::Vec<uint8_t> reencode_jpeg(rust::Slice<const uint8_t> jpeg_data)
{
    ...
}

// Asynchronously reencodes a JPEG to PNG via a thread pool.
void reencode_jpeg_async(rust::Slice<const uint8_t> jpeg_data)
{
    boost::asio::post(g_thread_pool, [=]() { reencode_jpeg(jpeg_data); });
}
```

But now we have a problem: how do we get the data back from the `reencode_jpeg` function? We don't want to block on retrieving the results from the thread pool, as that would keep blocking our Tokio event loop. What we need is a way to return to the event loop while the conversion process runs and subsequently to enqueue a task to send the results back to the client. Traditionally, we'd use a callback for this. On the C++ side:

```cpp
void reencode_jpeg(
    rust::Slice<const uint8_t> jpeg_data,
    rust::Fn<void(rust::Box<CallbackContext>, rust::Vec<uint8_t>)> callback,
    rust::Box<CallbackContext> context)
{
    ...

    callback(std::move(context), std::move(encodedPNG));
}

// Asynchronously reencodes a JPEG to PNG via a thread pool.
void reencode_jpeg_async(
    rust::Slice<const uint8_t> jpeg_data,
    rust::Fn<void(rust::Box<CallbackContext>, rust::Vec<uint8_t>)> callback,
    rust::Box<CallbackContext> context)
{
    boost::asio::post(g_thread_pool, [
        jpeg_data,
        callback = std::move(callback),
        context = std::move(context)
    ]() mutable {
        reencode_jpeg(jpeg_data, std::move(callback), std::move(context));
    });
}
```

And on the Rust side:

```rust
// The `cxx` bridge that declares the asynchronous function we want to call.
#[cxx::bridge]
mod ffi {
    extern "Rust" {
        type CallbackContext;
    }

    unsafe extern "C++" {
        include!("coroutine_example.h");
        fn reencode_jpeg_async(
            jpeg_data: &[u8],
            callback: fn(Box<CallbackContext>, result: Vec<u8>),
            context: Box<CallbackContext>,
        );
    }
}

pub struct CallbackContext(Sender<Vec<u8>>);

// Our REST endpoint, which calls the asynchronous C++ function.
#[post("/convert")]
async fn convert(jpeg_data: Bytes) -> impl Responder {
    let (sender, receiver) = oneshot::channel();
    let context = Box::new(CallbackContext(sender));
    ffi::reencode_jpeg_async(
        &jpeg_data,
        |context, encoded| drop(context.0.send(encoded)),
        context,
    );
    receiver.await.unwrap()
}
```

What a mess! We've replaced an elegant service with callback spaghetti and boilerplate. Surely there must be a better way.

It turns out that now there is, with `cxx-async`. We can upgrade our C++ code to C++20 and use the coroutines feature to dramatically reduce the boilerplate. First, we replace Boost with the thread pool from [Folly]:

```cpp
...
#include <folly/Executor.h>
#include <folly/executors/CPUThreadPoolExecutor.h>
...

folly::Executor::KeepAlive<folly::CPUThreadPoolExecutor> g_thread_pool(
    new folly::CPUThreadPoolExecutor(8));

auto reencode_jpeg(rust::Slice<const uint8_t> jpeg_data)
{
    ...
}

// Asynchronously reencodes a JPEG to PNG via a thread pool.
RustFutureVecU8 reencode_jpeg_async(rust::Slice<const uint8_t> jpeg_data)
{
    reencode_jpeg(std::move(jpeg_data)).semi().via(g_thread_pool);
}
```

(We could equally well have used [CppCoro], or another lightweight package, instead of Folly; we just need some C++ library that exposes thread pool work items as `co_await`able tasks. Folly was chosen for this example because it's the most popular coroutine library of this writing.)

Now we modify our C++ functions to be coroutines instead of taking callbacks:

```cpp
#define FOLLY_HAS_COROUTINES 1

...
#include <folly/experimental/coro/Task.h>
...

folly::coro::Task<rust::Vec<uint8_t>> reencode_jpeg(rust::Slice<const uint8_t> jpeg_data)
{
    ...

    co_return encodedPNG;
}

// Asynchronously reencodes a JPEG to PNG via a thread pool.
RustFutureVecU8 reencode_jpeg_async(rust::Slice<const uint8_t> jpeg_data)
{
    co_return co_await reencode_jpeg(std::move(jpeg_data)).semi().via(g_thread_pool);
}

```

In Rust, we write a `cxx_async::bridge` declaration and modify the `cxx::bridge` declaration like this:

```rust
// The `cxx` bridge that declares the asynchronous function we want to call.
#[cxx::bridge]
mod ffi {
    unsafe extern "C++" {
        include!("coroutine_example.h");
        type RustFutureVecU8 = crate::RustFutureVecU8;
        fn reencode_jpeg_async(jpeg_data: &[u8]) -> RustFutureVecU8;
    }
}

// The `cxx_async` bridge that defines the future we want to return.
#[cxx_async::bridge]
unsafe impl Future for RustFutureVecU8 {
    type Output = Vec<u8>;
}

```

And inside the service endpoint, all the callbacks disappear:

```rust
// Our REST endpoint, which calls the C++ coroutine.
#[post("/convert")]
async fn convert(jpeg_data: Bytes) -> impl Responder {
    ffi::reencode_jpeg_async(&jpeg_data).await.unwrap()
}
```

Notice how much nicer this is. We can keep the straight-line code that async Rust allows us to write, even across language boundaries. Additionally, the Rust code doesn't have to know about Folly, and the C++ code doesn't have to know about Tokio: `cxx-async` is generic over Rust coroutine libraries. Even if you aren't using C++ coroutines today, it may be worth introducing them to your project just to eliminate callbacks: there is no other solution I'm aware of that allows for callback-free async interoperability between languages.

The complete worked example can be found [on GitHub]. For comparison, the bad blocking version can be found in the [`blocking`] branch, while the callback-based version is in the [`callback-soup`] branch.

As noted before, `cxx-async` supports both CppCoro and Folly; [an example for CppCoro can be found here], and [here is an example for Folly]. If you're using another C++ coroutine library, you can add support for it to `cxx-async` using the same mechanisms. In both frameworks, asynchronous Rust code can call C++ coroutines, and C++ coroutines can `co_await` asynchronous Rust. Extra effort has been expended to ensure that Folly semifutures can run directly on Rust executors without the overhead of having to create a separate executor on the C++ side; in theory, this can make asynchronous Folly code *faster* than the equivalent code using callbacks.

The `cxx-async` crate is available on [crates.io]. Please feel free to try it out, report feedback, report issues, and send pull requests! Integration with `cxx` is a possibility in the future as `cxx-async` stabilizes and matures.

[^1]: In this *particular* toy example, we could instead dispatch to a thread pool on the Rust side and avoid the need to use `cxx-async`. But this doesn't work for C++ libraries that use coroutines internally.

[`cxx-async`]: https://github.com/pcwalton/cxx-async

[`cxx`]: https://cxx.rs/

[CppCoro]: https://github.com/lewissbaker/cppcoro

[Folly]: https://github.com/facebook/folly

[`boost::asio::thread_pool` type]: https://www.boost.org/doc/libs/1_80_0/doc/html/boost_asio/reference/thread_pool.html

[Lewis Baker's CppCoro library]: https://github.com/lewissbaker/cppcoro

[the README]: https://github.com/pcwalton/cxx-async/blob/main/README.md

[on GitHub]: https://github.com/pcwalton/cxx-async-example/

[`blocking`]: https://github.com/pcwalton/cxx-async-example/tree/blocking

[`callback-soup`]: https://github.com/pcwalton/cxx-async-example/tree/callback-soup

[an example for CppCoro can be found here]: https://github.com/pcwalton/cxx-async/tree/main/examples/cppcoro

[here is an example for Folly]: https://github.com/pcwalton/cxx-async/tree/main/examples/folly

[crates.io]: https://crates.io/crates/cxx-async