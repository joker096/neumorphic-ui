# Bracket Pair Colorizer 2 - Complete Help Reference

Bracket Pair Colorizer 2 enables bracket matching, auto-indentation, and colorization for brackets and contents inside.

## Colorization

By default, Bracket Pair Colorizer 2 uses the following colors: `#ff0000`, `#00ff00`, `#0000ff`, `#00ffff`, `#ff00ff`, `#ffff00`, `#ffffff`. These colors can be changed in your settings.

You can also use a custom theme by setting the `bracketPairColorizer.consecutivePairColors` setting to a list of bracket pair colors. Example:

```json
"bracketPairColorizer.consecutivePairColors": [
  "#ff0000",
  "#00ff00",
  "#0000ff",
]
```

**Note:** The configuration uses regular expressions to define colors, so be sure to escape special characters if needed.

## Independent Bracket Colorization

Colorization for `()` brackets is separated from other bracket types (`[]`, `{}`). Below is how you can configure each:

| Symbol class                                 | Regular expression         | Settings                                                                 |
|----------------------------------------------|----------------------------|--------------------------------------------------------------------------|
| Parentheses `()`                             | `/home/.*/`                | `bracketPairColorizer.colorMode`, `bracketPairColorizer.highlightScope`   |
| Brackets `[]`, braces `{}`                   | `/home/.*/`                | `bracketPairColorizer.colorModePairs`, `bracketPairColorizer.highlightScopePairs` |
| Both `()`, `[]` and `{}` at the same time    | `/home/.*/`                | `bracketPairColorizer.colorModeSeparatePairs`, `bracketPairColorizer.colorModeUnmatchedPair` |

## Custom Highlighting Scope

If you want to add a scope to the active brackets, you can set the scope with the `bracketPairColorizer.activeScope` setting. Example:
VS Code

```json
"bracketPairColorizer.activeScope": [
  "BracketPairColorizerActiveScope"
]
```

If the active scope doesn't exist, this extension will use the `editor.rangeHighlightBackground` setting.

If you want to highlight unmatched brackets, you can set the color with the `bracketPairColorizer.unmatchedScope` setting. Example:

```json
"bracketPairColorizer.unmatchedScope": "#ff0000"
```

If the unmatched scope doesn't exist, this extension will use the `editorBracketMatch.background` setting.

**NOTE:** You need to use a theme that loads the `editorBracketMatch.*` scope which comes by default in `dark-plus` and `light-plus`. If you are using a custom color theme, you can add the following to your settings:
VS Code

```json
"editor.tokenColorCustomizations": {
  "textMateRules": [
    {
      "scope": [
        "editorBracketMatch.background",
        "editorBracketMatch.border"
      ],
      "settings": {
        "foreground": "#ffcc00",
        "background": "#ffcc00",
        "border": "#ffcc00"
      }
    }
  ]
}
```

**Note:** You can ignore this step if your theme already loads the `editorBracketMatch.*` scope.

## Performance

Bracket Pair Colorizer 2 uses an optimized algorithm that is much faster than the original Bracket Pair Colorizer. The source code can be found at [https://github.com/CoenraadS/BracketPair](https://github.com/CoenraadS/BracketPair).

The `bracketPairColorizer.showBracketsInGutter` setting can be enabled to show brackets in the editor glyph margin. The `bracketPairColorizer.showBracketsInRuler` setting can be used to show brackets in the editor ruler.

If you find that the colorizer is still too slow, you can use the `files.exclude` setting to exclude large folders, or change the `files.maxMemoryForLargeFilesMB` setting. Further details are available in the VS Code documentation at [https://code.visualstudio.com/docs/getstarted/settings](https://code.visualstudio.com/docs/getstarted/settings).

## Settings Overview

| Setting | Description | Default value | Available options |
|---------|-------------|---------------|-------------------|
| `bracketPairColorizer.colorMode` | Colorization mode for `()` type brackets | `Consecutive` | `None`, `Independent`, `Consecutive` |
| `bracketPairColorizer.colorModePairs` | Colorization mode for `[]` and `{}` type brackets | `Consecutive` | `None`, `Independent`, `Consecutive` |
| `bracketPairColorizer.colorModeSeparatePairs` | Colorization mode for all brackets `()`, `[]` and `{}` | `Consecutive` | `None`, `Independent`, `Consecutive` |
| `bracketPairColorizer.consecutivePairColors` | Colors for consecutive bracket pairs | `["#ff0000", "#00ff00", "#0000ff", "#00ffff", "#ff00ff", "#ffff00", "#ffffff"]` | List of valid CSS colors |
| `bracketPairColorizer.colorModeUnmatchedPair` | Colorization mode for unmatched bracket [`string`] | `Disabled` | `Disabled`, `Enabled` |
| `bracketPairColorizer.unmatchedScope` | Color for unmatched brackets | `'' ` | Valid CSS color |
| `bracketPairColorizer.showBracketsInGutter` | Show basic brackets in the editor glyph margin | `true` | `true`, `false` |
| `bracketPairColorizer.showBracketsInRuler` | Show brackets in the editor ruler | `false` | `true`, `false` |
| `bracketPairColorizer.showVerticalScopeLine` | Show vertical scope line between brackets | `true` | `true`, `false` |
| `bracketPairColorizer.showHorizontalScopeLine` | Show horizontal scope line between brackets | `true` | `true`, `false` |
| `bracketPairColorizer.scopeLineSeparator` | Separator for scope lines | `'' ` | String pattern |
| `bracketPairColorizer.showBracketTypes` | Which bracket types to show in gutter | `[]{}() ` | `[]`, `{}`, `()` |
| `bracketPairColorizer.indicatorLine` | Which indicator line to use | `[]{}() ` | `[]`, `{}`, `()`, `''` |
| `bracketPairColorizer.indicatorLineStyle` | Style for indicator lines | `solid` | `solid`, `dotted`, `dashed` |
| `bracketPairColorizer.highlightActiveScope` | Highlight the scope of the active bracket pair | `false` | `true`, `false` |
| `bracketPairColorizer.highlightScope` | Highlight scope colors for `()` | `[]` | List of valid CSS colors |
| `bracketPairColorizer.highlightScopePairs` | Highlight scope colors for `[]` and `{}` | `[]` | List of valid CSS colors |
| `bracketPairColorizer.highlightScopeSeparatePairs` | Highlight scope colors for all brackets | `[]` | List of valid CSS colors |
| `bracketPairColorizer.activeScope` | Active bracket pair scope | `[]` | List of valid VS Code scopes |
| `bracketPairColorizer.forceUniqueScopeLine` | Force a unique scope line for each pair | `false` | `true`, `false` |
| `bracketPairColorizer.forceIteration` | Force use of the iteration algorithm | `false` | `true`, `false` |
| `bracketPairColorizer.autoCloseBrackets` | Automatically close overlapping brackets | `false` | `true`, `false` |

## Language Support

By default, most languages are supported. If you need to enable Bracket Pair Colorizer 2 for additional languages, you can use the `bracketPairColorizer.languageMap` setting.

Example for HTML:

```json
"bracketPairColorizer.languageMap": {
  "html": "()"
}
```

Available symbols: `[`, `]`, `(`, `)`, `{`, `}`. You can also combine them: `(){}[]`.

**Note:** Changes to these settings require restarting VS Code to take effect.

## Extension Settings

### Bracket Matching

Automatically close brackets when opening is typed.

**Available options:**

- `languageDefined` - Use language configuration to determine when to auto close.
- `beforeWhitespace` - Close when cursor is to the left of whitespace.
- `never` - Never auto close.

**Default:** `languageDefined`

**Note:** The `beforeWhitespace` behavior only works when `editor.autoClosingBrackets` is set to `languageDefined`.

### Auto Indent

Automatically re-indent lines when brackets are inserted.

**Default:** `none`

**Available options:**

- `none` - No re-indent.
- `keep` - Keep current line's indentation.
- `brackets` - Re-indent after opening or closing a bracket.
- `languageDefined` - Re-indent based on language rules.

### Surround

Automatically add surrounding quotes or brackets when typing.

**Default:** `languageDefined`

**Available options:**

- `languageDefined` - Use language configuration.
- `quotes` - Surround with quotes.
- `doubleQuotes` - Surround with double quotes.
- `singleQuotes` - Surround with single quotes.
- `backticks` - Surround with backticks.
- `brackets` - Surround with brackets.
- `angleBrackets` - Surround with angle brackets.

**Example:**

```css
// Auto close brackets for CSS
"editor.autoClosingBrackets": "languageDefined"
```

## Troubleshooting

**Q: The colorizer is not working after installing Bracket Pair Colorizer 2.**

A: There may be a conflict with another VS Code extension that also modifies brackets. Try disabling other extensions that modify brackets one at a time to see if the colorizer starts working.

**Q: Brackets are not colored correctly.**

A: Make sure your theme supports bracket coloring, and that the `bracketPairColorizer` settings are properly configured. Some older themes may not support the necessary scopes.

**Q: The colorizer is slow in my project.**

A: Try excluding large folders using the `files.exclude` setting, or increasing `files.maxMemoryForLargeFilesMB`. You can also disable certain features like gutter brackets or ruler brackets to improve performance.

## Release Notes

See [CHANGELOG.md](CHANGELOG.md) for the latest changes.

## Known Issues

None at this time. If you find a bug, please report it at [https://github.com/CoenraadS/BracketPair/issues](https://github.com/CoenraadS/BracketPair/issues).
