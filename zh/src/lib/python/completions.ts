import {
  type Completion,
  type CompletionContext,
  autocompletion,
  snippet,
} from "@codemirror/autocomplete";

const KEYWORDS: Completion[] = [
  "False",
  "None",
  "True",
  "and",
  "as",
  "assert",
  "async",
  "await",
  "break",
  "class",
  "continue",
  "def",
  "del",
  "elif",
  "else",
  "except",
  "finally",
  "for",
  "from",
  "global",
  "if",
  "import",
  "in",
  "is",
  "lambda",
  "nonlocal",
  "not",
  "or",
  "pass",
  "raise",
  "return",
  "try",
  "while",
  "with",
  "yield",
].map((label) => ({ label, type: "keyword" }));

const BUILTINS: Completion[] = [
  "abs",
  "all",
  "any",
  "ascii",
  "bin",
  "bool",
  "bytearray",
  "bytes",
  "callable",
  "chr",
  "classmethod",
  "compile",
  "complex",
  "dict",
  "dir",
  "divmod",
  "enumerate",
  "eval",
  "exec",
  "filter",
  "float",
  "format",
  "frozenset",
  "getattr",
  "globals",
  "hasattr",
  "hash",
  "help",
  "hex",
  "id",
  "input",
  "int",
  "isinstance",
  "issubclass",
  "iter",
  "len",
  "list",
  "locals",
  "map",
  "max",
  "min",
  "next",
  "object",
  "oct",
  "open",
  "ord",
  "pow",
  "print",
  "property",
  "range",
  "repr",
  "reversed",
  "round",
  "set",
  "setattr",
  "slice",
  "sorted",
  "staticmethod",
  "str",
  "sum",
  "super",
  "tuple",
  "type",
  "vars",
  "zip",
].map((label) => ({ label, type: "function" }));

const MODULES = [
  "math",
  "random",
  "statistics",
  "datetime",
  "time",
  "json",
  "re",
  "os",
  "sys",
  "pathlib",
  "collections",
  "itertools",
  "functools",
  "typing",
  "dataclasses",
  "csv",
  "io",
  "base64",
  "hashlib",
  "decimal",
  "fractions",
  "pprint",
  "unittest",
  "traceback",
  "ast",
  "numpy",
  "pandas",
  "matplotlib",
  "matplotlib.pyplot",
  "scipy",
  "sklearn",
  "PIL",
  "sympy",
  "networkx",
].map((label) => ({ label, type: "namespace" as const }));

const SNIPPETS: Completion[] = [
  {
    label: "def",
    type: "keyword",
    detail: "function",
    apply: snippet("def ${name}(${args}):\n    ${pass}"),
  },
  {
    label: "class",
    type: "keyword",
    detail: "class",
    apply: snippet("class ${Name}:\n    def __init__(self${}):\n        ${pass}"),
  },
  { label: "if", type: "keyword", apply: snippet("if ${condition}:\n    ${pass}") },
  { label: "for", type: "keyword", apply: snippet("for ${item} in ${iterable}:\n    ${pass}") },
  { label: "while", type: "keyword", apply: snippet("while ${condition}:\n    ${pass}") },
  {
    label: "try",
    type: "keyword",
    apply: snippet("try:\n    ${pass}\nexcept ${Exception} as ${exc}:\n    ${raise}"),
  },
  { label: "with", type: "keyword", apply: snippet("with ${expr} as ${name}:\n    ${pass}") },
  {
    label: "main",
    type: "snippet",
    detail: "entrypoint",
    apply: snippet('if __name__ == "__main__":\n    ${main()}'),
  },
  { label: "print", type: "function", apply: snippet("print(${})") },
];

const MEMBERS: Record<string, string[]> = {
  math: ["sqrt", "sin", "cos", "tan", "pi", "e", "floor", "ceil", "log", "log10", "exp", "pow", "radians", "degrees"],
  random: ["random", "randint", "choice", "shuffle", "sample", "seed", "uniform", "gauss"],
  json: ["loads", "dumps", "load", "dump"],
  re: ["compile", "search", "match", "findall", "sub", "split"],
  os: ["path", "getcwd", "listdir", "environ", "name"],
  sys: ["version", "argv", "path", "platform", "exit", "stdin", "stdout", "stderr"],
  np: ["array", "arange", "linspace", "zeros", "ones", "dot", "mean", "sum", "shape", "reshape"],
  numpy: ["array", "arange", "linspace", "zeros", "ones", "dot", "mean"],
  pd: ["DataFrame", "Series", "read_csv", "concat"],
  pandas: ["DataFrame", "Series", "read_csv", "concat"],
  plt: ["plot", "scatter", "bar", "hist", "show", "title", "xlabel", "ylabel", "legend", "subplots", "tight_layout"],
};

function identifiersIn(doc: string): Completion[] {
  const found = new Set<string>();
  for (const m of doc.matchAll(/\b([A-Za-z_][A-Za-z0-9_]{1,40})\b/g)) {
    if (m[1]) found.add(m[1]);
  }
  return [...found].slice(0, 80).map((label) => ({ label, type: "variable" }));
}

function pythonCompletions(context: CompletionContext) {
  const importBefore = context.matchBefore(/(?:from|import)\s+[\w.]*$/);
  if (importBefore) {
    const start = importBefore.from + importBefore.text.search(/[\w.]+$/);
    return {
      from: start < 0 ? importBefore.to : start,
      options: MODULES,
      validFor: /^[\w.]*$/,
    };
  }

  const dotted = context.matchBefore(/[A-Za-z_][\w]*\.\w*$/);
  if (dotted) {
    const parts = dotted.text.split(".");
    const obj = parts[0] ?? "";
    const partial = parts[1] ?? "";
    const members = MEMBERS[obj] ?? [];
    return {
      from: dotted.from + obj.length + 1,
      options: members
        .filter((m) => m.startsWith(partial))
        .map((label) => ({ label, type: "property" as const })),
      validFor: /^\w*$/,
    };
  }

  const word = context.matchBefore(/[\w]+/);
  if (!word || (word.from === word.to && !context.explicit)) return null;

  const local = identifiersIn(context.state.doc.toString());
  return {
    from: word.from,
    options: [...SNIPPETS, ...KEYWORDS, ...BUILTINS, ...MODULES, ...local],
    validFor: /^\w*$/,
  };
}

export function pythonAutocomplete() {
  return autocompletion({
    override: [pythonCompletions],
    defaultKeymap: true,
    activateOnTyping: true,
    closeOnBlur: false,
    icons: true,
  });
}
