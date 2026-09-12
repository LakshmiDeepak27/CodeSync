export const ROLES = {
  OWNER: 'OWNER',
  EDITOR: 'EDITOR',
  VIEWER: 'VIEWER'
};

export const VISIBILITY = {
  PUBLIC: 'PUBLIC',
  PRIVATE: 'PRIVATE'
};

export const EXECUTION_STATUS = {
  QUEUED: 'QUEUED',
  COMPILING: 'COMPILING',
  RUNNING: 'RUNNING',
  COMPLETED: 'COMPLETED',
  COMPILATION_ERROR: 'COMPILATION_ERROR',
  RUNTIME_ERROR: 'RUNTIME_ERROR',
  TIME_LIMIT: 'TIME_LIMIT',
  MEMORY_LIMIT: 'MEMORY_LIMIT',
  EXECUTION_ERROR: 'EXECUTION_ERROR',
  JUDGE_ERROR: 'JUDGE_ERROR'
};

export const SUPPORTED_LANGUAGES = {
  cpp: {
    id: 'cpp',
    name: 'C++ (GCC 9.2.0)',
    judge0Id: 54,
    extension: '.cpp',
    monacoLanguage: 'cpp',
    defaultFileName: 'main.cpp',
    defaultCode: `#include <iostream>

int main() {
    std::cout << "Hello, CodeSync!" << std::endl;
    return 0;
}
`
  },
  c: {
    id: 'c',
    name: 'C (GCC 9.2.0)',
    judge0Id: 50,
    extension: '.c',
    monacoLanguage: 'c',
    defaultFileName: 'main.c',
    defaultCode: `#include <stdio.h>

int main() {
    printf("Hello, CodeSync!\\n");
    return 0;
}
`
  },
  python: {
    id: 'python',
    name: 'Python (3.8.1)',
    judge0Id: 71,
    extension: '.py',
    monacoLanguage: 'python',
    defaultFileName: 'main.py',
    defaultCode: `print("Hello, CodeSync!")
`
  },
  javascript: {
    id: 'javascript',
    name: 'JavaScript (Node.js 12.14.0)',
    judge0Id: 63,
    extension: '.js',
    monacoLanguage: 'javascript',
    defaultFileName: 'index.js',
    defaultCode: `console.log("Hello, CodeSync!");\n`
  }
};

export const DEFAULT_LANGUAGE = 'cpp';
