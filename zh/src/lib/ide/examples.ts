export const WELCOME_CODE = `# Welcome to Zhina Python
# A real Python interpreter that runs on this device.
# Press the Run button in the lower right to try it.

def greet(name: str) -> str:
    return f"Hello, {name} — welcome to Zhina."


print(greet("friend"))
print()

# Change the range, then run again.
for n in range(1, 6):
    print(f"{n} × {n} = {n * n}")

print()
print("Tips")
print("- Block lines follow indentation")
print("- Open Settings to change fonts and colours")
print("- Put the terminal on its own screen if you prefer")
`;

export const EXAMPLES: { id: string; title: string; code: string }[] = [
  { id: "welcome", title: "Welcome", code: WELCOME_CODE },
  {
    id: "functions",
    title: "Functions",
    code: `def factorial(n: int) -> int:
    if n < 0:
        raise ValueError("n must be >= 0")
    result = 1
    for k in range(2, n + 1):
        result *= k
    return result


def describe(n: int) -> str:
    return f"{n}! = {factorial(n)}"


for value in (0, 1, 5, 8):
    print(describe(value))
`,
  },
  {
    id: "errors",
    title: "Error reporting",
    code: `# Run this file to see how Zhina names the error and the line.
# Then fix it and run again.

def area(width, height):
    return width * height


print("3 × 4 =", area(3, 4))
print("10 × ? =", area(10, height))
`,
  },
  {
    id: "input",
    title: "Reading input",
    code: `# Type answers in the Program input box (terminal), one line each,
# then press Run.

name = input("Your name: ")
times = int(input("How many times? "))

for i in range(times):
    print(f"{i + 1}. Nice to meet you, {name}.")
`,
  },
  {
    id: "data",
    title: "Lists and dicts",
    code: `scores = {"Ada": 18, "Lin": 21, "Grace": 19}

print("Roster")
for name, score in sorted(scores.items()):
    bar = "■" * score
    print(f"  {name:8} {score:2}  {bar}")

average = sum(scores.values()) / len(scores)
print()
print(f"Average: {average:.1f}")
print("Top:", max(scores, key=scores.get))
`,
  },
  {
    id: "chart",
    title: "Chart (matplotlib)",
    code: `import matplotlib.pyplot as plt

xs = list(range(0, 11))
ys = [x * x for x in xs]

fig, ax = plt.subplots(figsize=(6, 3.4))
ax.plot(xs, ys, color="#3d4a55", marker="o")
ax.set_title("Squares")
ax.set_xlabel("n")
ax.set_ylabel("n²")
ax.grid(True, alpha=0.3)
fig.tight_layout()
print("Chart drawn below.")
`,
  },
];
