export type Fixture = { id: string; label: string; language: 'cpp' | 'cmake' | 'shell'; text: string; cursor: number }

export const fixtures: Fixture[] = [
  { id: 'cpp', label: 'C++ function', language: 'cpp', cursor: 0, text: `#include <string>\n\nstd::string greet(const std::string& name) {\n  return "Hello, " + name;\n}\n` },
  { id: 'cmake', label: 'CMake target', language: 'cmake', cursor: 0, text: `cmake_minimum_required(VERSION 3.24)\nproject(VimLab LANGUAGES CXX)\n\nadd_executable(vim_lab main.cpp)\ntarget_compile_features(vim_lab PRIVATE cxx_std_20)\n` },
  { id: 'shell', label: 'Shell function', language: 'shell', cursor: 0, text: `#!/usr/bin/env bash\nset -euo pipefail\n\nbuild_project() {\n  cmake -S . -B build\n  cmake --build build\n}\n` },
]

export type ReferenceSequence = { id: string; label: string; description: string; tokens: string[] }
export const sequences: ReferenceSequence[] = [
  { id: 'compose', label: 'Compose operator + motion', description: 'Moves to the next word, deletes two words, then enters and exits Insert mode.', tokens: ['w', '2', 'd', 'w', 'i', 'X', '<Esc>'] },
  { id: 'text-object', label: 'Inner text object', description: 'Changes inside the next pair of parentheses.', tokens: ['/', '(', '<Enter>', 'c', 'i', '(', 'value', '<Esc>'] },
  { id: 'repeat', label: 'Dot repeat', description: 'Changes a word and repeats the change at the next match.', tokens: ['c', 'i', 'w', 'item', '<Esc>', 'w', '.'] },
]
