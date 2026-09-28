export type LibraryKind = "stdlib" | "bundled" | "pypi";

export type LibraryInfo = {
  name: string;
  kind: LibraryKind;
  summary: string;
  docsUrl: string;
  pypiUrl: string;
};

function pypi(name: string) {
  return `https://pypi.org/project/${name}/`;
}

function stdlibDocs(mod: string) {
  return `https://docs.python.org/3/library/${mod}.html`;
}

export const STDLIB_MODULES: LibraryInfo[] = [
  ["math", "Mathematical functions"],
  ["random", "Random numbers"],
  ["statistics", "Mean, median, variance"],
  ["datetime", "Dates and times"],
  ["time", "Clocks and sleep"],
  ["json", "JSON encode and decode"],
  ["re", "Regular expressions"],
  ["os", "Operating system interface (limited in the browser)"],
  ["sys", "Interpreter state"],
  ["pathlib", "Object-oriented paths"],
  ["collections", "Deque, Counter, defaultdict"],
  ["itertools", "Iterators and combinatorics"],
  ["functools", "lru_cache, reduce, partial"],
  ["typing", "Type hints"],
  ["dataclasses", "Data classes"],
  ["enum", "Enumerations"],
  ["copy", "Shallow and deep copy"],
  ["csv", "CSV reader and writer"],
  ["io", "In-memory streams"],
  ["base64", "Base64 encoding"],
  ["hashlib", "Hashes"],
  ["html", "HTML escaping"],
  ["textwrap", "Wrap and fill text"],
  ["string", "String constants and Template"],
  ["decimal", "Decimal arithmetic"],
  ["fractions", "Rational numbers"],
  ["pprint", "Pretty printers"],
  ["unittest", "Unit testing"],
  ["doctest", "Docstring tests"],
  ["argparse", "Command-line parsing"],
  ["logging", "Logging"],
  ["traceback", "Print traces"],
  ["ast", "Abstract syntax trees"],
  ["inspect", "Live object inspection"],
  ["operator", "Function equivalents of operators"],
  ["abc", "Abstract base classes"],
  ["contextlib", "Context managers"],
  ["calendar", "Calendars"],
  ["zoneinfo", "IANA time zones"],
  ["unicodedata", "Unicode database"],
  ["urllib.parse", "URL parsing"],
].map(([name, summary]) => ({
  name,
  kind: "stdlib" as const,
  summary,
  docsUrl: stdlibDocs(name.split(".")[0] ?? name),
  pypiUrl: pypi(name.split(".")[0] ?? name),
}));

/** Packages available via Pyodide when online (or if wheels were pre-bundled under /pyodide/). */
export const BUNDLED_PACKAGES: LibraryInfo[] = [
  {
    name: "numpy",
    kind: "bundled",
    summary: "Arrays and numerical computing",
    docsUrl: "https://numpy.org/doc/stable/",
    pypiUrl: pypi("numpy"),
  },
  {
    name: "pandas",
    kind: "bundled",
    summary: "Data frames and analysis",
    docsUrl: "https://pandas.pydata.org/docs/",
    pypiUrl: pypi("pandas"),
  },
  {
    name: "matplotlib",
    kind: "bundled",
    summary: "Charts and plots",
    docsUrl: "https://matplotlib.org/stable/",
    pypiUrl: pypi("matplotlib"),
  },
  {
    name: "scipy",
    kind: "bundled",
    summary: "Scientific computing",
    docsUrl: "https://docs.scipy.org/doc/scipy/",
    pypiUrl: pypi("scipy"),
  },
  {
    name: "scikit-learn",
    kind: "bundled",
    summary: "Machine learning",
    docsUrl: "https://scikit-learn.org/stable/",
    pypiUrl: pypi("scikit-learn"),
  },
  {
    name: "pillow",
    kind: "bundled",
    summary: "Image processing (PIL)",
    docsUrl: "https://pillow.readthedocs.io/",
    pypiUrl: pypi("pillow"),
  },
  {
    name: "sympy",
    kind: "bundled",
    summary: "Symbolic math",
    docsUrl: "https://docs.sympy.org/",
    pypiUrl: pypi("sympy"),
  },
  {
    name: "networkx",
    kind: "bundled",
    summary: "Graphs and networks",
    docsUrl: "https://networkx.org/documentation/stable/",
    pypiUrl: pypi("networkx"),
  },
  {
    name: "regex",
    kind: "bundled",
    summary: "Advanced regular expressions",
    docsUrl: "https://github.com/mrabarnett/mrab-regex",
    pypiUrl: pypi("regex"),
  },
  {
    name: "pyyaml",
    kind: "bundled",
    summary: "YAML parser",
    docsUrl: "https://pyyaml.org/",
    pypiUrl: pypi("pyyaml"),
  },
  {
    name: "beautifulsoup4",
    kind: "bundled",
    summary: "HTML / XML parsing",
    docsUrl: "https://www.crummy.com/software/BeautifulSoup/bs4/doc/",
    pypiUrl: pypi("beautifulsoup4"),
  },
  {
    name: "lxml",
    kind: "bundled",
    summary: "Fast XML / HTML",
    docsUrl: "https://lxml.de/",
    pypiUrl: pypi("lxml"),
  },
];

export const SUGGESTED_PYPI: LibraryInfo[] = [
  {
    name: "cowsay",
    kind: "pypi",
    summary: "Tiny example of a pure-Python package",
    docsUrl: pypi("cowsay"),
    pypiUrl: pypi("cowsay"),
  },
  {
    name: "pydantic",
    kind: "pypi",
    summary: "Data validation (pure Python parts)",
    docsUrl: "https://docs.pydantic.dev/",
    pypiUrl: pypi("pydantic"),
  },
];

export const PYPI_SEARCH = "https://pypi.org/search/?q=";
export const PYPI_HOME = "https://pypi.org/";
export const PYODIDE_PACKAGES = "https://pyodide.org/en/stable/usage/packages-in-pyodide.html";

export const IMPORT_TO_PACKAGE: Record<string, string> = {
  numpy: "numpy",
  np: "numpy",
  pandas: "pandas",
  pd: "pandas",
  matplotlib: "matplotlib",
  plt: "matplotlib",
  scipy: "scipy",
  sklearn: "scikit-learn",
  PIL: "pillow",
  pillow: "pillow",
  sympy: "sympy",
  networkx: "networkx",
  nx: "networkx",
  yaml: "pyyaml",
  bs4: "beautifulsoup4",
  lxml: "lxml",
  cv2: "opencv-python",
};

export function pypiProjectUrl(name: string) {
  const slug = name.trim().toLowerCase().replace(/_/g, "-");
  return `https://pypi.org/project/${encodeURIComponent(slug)}/`;
}
