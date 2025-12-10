---
title: "A Developer's Guide to Memory-Mapped Files (mmap)"
description: "Exploring the power and pitfalls of memory-mapped file I/O."
author: "Md Sohail"
publishDate: 2025-11-18T00:00:00Z
tags: ["systems-programming", "mmap", "performance", "golang"]
---

# A Developer's Guide to Memory-Mapped Files (mmap)

In systems programming, there's a technique that feels both like a powerful shortcut and a hidden trap: `mmap`, or memory-mapped file I/O. If you're accustomed to the traditional routine of managing buffers and `read`/`write` system calls, `mmap` can seem like a revelation. It allows you to treat a file on disk as if it were a part of your program's memory.

This post explores that idea: the performance benefits of treating your hard drive like RAM, and the subtle complexities that have challenged even experienced database developers.

## The Core Concept: How It Works

With traditional file I/O, you ask the operating system (OS) to read data from a disk and copy it into a buffer in your program's memory. With `mmap`, you ask the OS to map the file's contents directly into your program’s virtual address space. The result is a pointer (or a slice in Go) that you can use to access the file's data as if it were an in-memory array.





**![](./how-mmap-works.png)**
 ˘<small>*(Image Prompt: A diagram showing a large file on a hard disk on the left, and a block of Virtual Memory addresses on the right. Dotted lines connect specific chunks of the disk file to specific addresses in memory. A label points to the memory saying "To the code, this looks like RAM," while a label points to the connection saying "OS loads pages lazily.")*</small>

### Code Comparison: Standard I/O vs. mmap

The difference in code makes the "magic" of `mmap` clear.

**Standard I/O**

This approach requires you to manage buffers and file offsets manually.

```go
// Traditional File Reading
file, err := os.Open("large_data.bin")
if err != nil {
    log.Fatal(err)
}
defer file.Close()

// We have to manage a buffer in user-space
buf := make([]byte, 1024)
for {
    n, err := file.Read(buf)
    if err != nil && err != io.EOF {
        log.Fatal(err)
    }
    if n == 0 {
        break
    }
    // Process buf[:n]...
}
```

**mmap**

With `mmap`, the file's data is accessed like a variable in your application, with no explicit read calls. The following example uses the `gommap` library, a Go wrapper for the `mmap` system call.

```go
// Using launchpad.net/gommap
file, _ := os.Open("large_data.bin", os.O_RDONLY, 0)
// Map the file directly into memory
mmap, _ := gommap.Map(file.Fd(), gommap.PROT_READ, gommap.MAP_PRIVATE)

// Access file contents like a normal slice!
// No seek(), no read(), just array indexing.
end := bytes.Index(mmap, []byte("\n"))
println(string(mmap[:end]))
```

The OS performs a "lazy" load. It reserves the address space, but only loads a page of data from the disk when your program accesses a memory address within that page. This triggers a "page fault," a hardware interrupt that signals the OS to fetch the required data. This process is transparent to your application.

## The Advantage: Zero-Copy I/O

The primary benefit of `mmap` is **Zero-Copy I/O**. In traditional `read()`, data is copied from the disk to the kernel's page cache, and then from the page cache to your program's user-space buffer. The second copy is redundant. `mmap` allows your program to access the kernel's page cache directly, eliminating this extra copy and reducing CPU overhead.





**![](./zero-copy.png)**
<small>*(Image Prompt: A split comparison. Top (Standard): A "Bucket Brigade" where the Kernel hands data to a User Buffer (Copy). Bottom (mmap): The User accesses the Kernel's bucket directly. Caption: "mmap avoids the redundant copy to user space.")*</small>

## The Hidden Perils

However, `mmap` is not a "free lunch." The abstraction that makes it so convenient also introduces complexities.

### 1. The Illusion of Memory and I/O Stalls

While your code appears to be accessing memory, which is typically a nanosecond-scale operation, a page fault can cause your thread to block for milliseconds while the OS fetches the data from the much slower disk. This is especially problematic for schedulers that are not designed to distinguish between a page fault and a CPU-bound operation, potentially leading to under-utilization of system resources.




**![](./page-fault.png)**
<small>*(Image Prompt: A timeline graph. The CPU line is active (green), then hits a red block "Page Fault." The line goes flat while "Disk I/O" spikes. Caption: "Your thread freezes unpredictably when touching a memory address.")*</small>

### 2. The Danger of SIGBUS and Difficult Error Handling

With standard I/O, a disk failure or a file truncation results in an error that your program can handle gracefully. With `mmap`, if you access an index that is beyond the file's current size (perhaps because another process truncated it), the hardware raises an exception, and the OS sends your program a `SIGBUS` or `SIGSEGV` signal, causing it to crash immediately. This makes error handling significantly more complex, often requiring the implementation of signal handlers, which are notoriously difficult to write correctly.

This isn't just a theoretical problem. **MongoDB's original storage engine (MMAPv1)** was built on `mmap` and faced challenges with space wastage and complexity, eventually leading to its replacement.

### 3. Performance on Fast Drives (NVMe)

Counter-intuitively, `mmap` can be slower than standard I/O on very fast NVMe SSDs. The overhead of managing page tables and handling "TLB shootdowns" (the process of invalidating cached memory address translations across multiple CPU cores) can become a bottleneck in high-throughput scenarios. This is a key reason why high-performance databases like **SingleStore** and **InfluxDB** have moved away from `mmap`, citing issues with I/O spikes and contention.

## Conclusion: When to Use mmap

`mmap` is a powerful, specialized tool. It's a good choice when:

*   You have large files and need random access.
*   Multiple processes need to read the same file, as they can share the same physical memory pages.
*   Your workload is read-only and the data fits comfortably in RAM.

It's probably *not* the right choice when:

*   You need strict transactional safety, as in a database.
*   You require the highest possible throughput on fast SSDs.
*   You cannot tolerate the risk of unpredictable crashes due to I/O errors.

`mmap` offers a fascinating look into the abstractions that operating systems provide. It blurs the line between files and memory, but like any powerful tool, it requires a deep understanding of its underlying mechanics to be used effectively.

## References

*   A good wrapper for the mmap written in Go [here.](https://labix.org/gommap)
*   [This](https://github.com/buildbarn/bb-storage/blob/c346ca331930f1bc5e4f9bde75de96ee3e6c8a9c/pkg/blockdevice/memory_mapped_block_device_unix.go#L49) is a piece of open-source Go code that uses a page-fault handler to deal with any IO error that may arise from memory mapping. The Debug packages `SetPanicOnFault` function is used.
*   I’m still reading this paper by Andy Pavlo & other researchers on reasons to avoid MMap in your DBMS check it out [Youtube](https://www.youtube.com/watch?v=1BRGU_AS25c) and [Paper.](https://www.cidrdb.org/cidr2022/papers/p13-crotty.pdf)
