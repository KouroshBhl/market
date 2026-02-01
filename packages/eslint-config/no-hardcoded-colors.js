/**
 * Custom ESLint rule to prevent hardcoded Tailwind color utilities.
 * Enforces usage of theme tokens from the shared design system.
 */

const TAILWIND_COLORS = [
  "slate", "gray", "zinc", "neutral", "stone",
  "red", "orange", "amber", "yellow", "lime",
  "green", "emerald", "teal", "cyan", "sky",
  "blue", "indigo", "violet", "purple", "fuchsia",
  "pink", "rose"
];

const COLOR_UTILITIES = [
  "bg", "text", "border", "ring",
  "from", "via", "to",
  "outline", "shadow", "divide",
  "decoration", "placeholder", "caret"
];

/**
 * Creates a regex pattern to match hardcoded Tailwind color classes
 * Examples: bg-blue-500, text-gray-600, border-red-300
 */
function createColorPattern() {
  const colorNames = TAILWIND_COLORS.join("|");
  const utilities = COLOR_UTILITIES.join("|");
  
  // Matches: utility-color-shade (e.g., bg-blue-500, text-gray-600)
  return new RegExp(
    `\\b(${utilities})-(${colorNames})-(\\d{2,3}|950)\\b`,
    "g"
  );
}

const HARDCODED_COLOR_PATTERN = createColorPattern();

/**
 * Allowed theme tokens that should be used instead
 */
const ALLOWED_TOKENS = [
  "bg-background", "bg-foreground", "bg-card", "bg-card-foreground",
  "bg-popover", "bg-popover-foreground", "bg-primary", "bg-primary-foreground",
  "bg-secondary", "bg-secondary-foreground", "bg-muted", "bg-muted-foreground",
  "bg-accent", "bg-accent-foreground", "bg-destructive", "bg-destructive-foreground",
  "bg-border", "bg-input", "bg-ring", "bg-sidebar", "bg-sidebar-foreground",
  "text-foreground", "text-background", "text-card", "text-card-foreground",
  "text-popover", "text-popover-foreground", "text-primary", "text-primary-foreground",
  "text-secondary", "text-secondary-foreground", "text-muted", "text-muted-foreground",
  "text-accent", "text-accent-foreground", "text-destructive", "text-destructive-foreground",
  "border-background", "border-foreground", "border-border", "border-input",
  "border-ring", "border-primary", "border-secondary", "border-muted",
  "border-accent", "border-destructive",
  "ring-ring", "ring-offset-background"
];

const noHardcodedColorsRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow hardcoded Tailwind color utilities",
      category: "Stylistic Issues",
      recommended: true,
    },
    messages: {
      hardcodedColor: 
        "Hardcoded Tailwind color '{{className}}' is forbidden. Use theme tokens ({{tokens}}) or shadcn component variants instead.",
    },
    schema: [],
  },

  create(context) {
    return {
      JSXAttribute(node) {
        // Only check className and class attributes
        if (!node.name || !["className", "class"].includes(node.name.name)) {
          return;
        }

        let classValue = "";

        // Handle different value types
        if (node.value?.type === "Literal" && typeof node.value.value === "string") {
          classValue = node.value.value;
        } else if (node.value?.type === "JSXExpressionContainer") {
          // Handle template literals and string expressions
          const expression = node.value.expression;
          
          if (expression.type === "TemplateLiteral") {
            // Extract static parts from template literal
            classValue = expression.quasis.map(q => q.value.raw).join(" ");
          } else if (expression.type === "Literal" && typeof expression.value === "string") {
            classValue = expression.value;
          }
        }

        if (!classValue) return;

        // Find all hardcoded color matches
        const matches = [...classValue.matchAll(HARDCODED_COLOR_PATTERN)];
        
        matches.forEach(match => {
          const hardcodedClass = match[0];
          const utility = match[1];
          
          // Suggest relevant tokens based on the utility prefix
          let suggestedTokens = ALLOWED_TOKENS
            .filter(token => token.startsWith(utility))
            .slice(0, 3)
            .join(", ");
          
          if (!suggestedTokens) {
            suggestedTokens = "bg-background, text-foreground, border-border, ring-ring";
          }

          context.report({
            node,
            messageId: "hardcodedColor",
            data: {
              className: hardcodedClass,
              tokens: suggestedTokens,
            },
          });
        });
      },
    };
  },
};

export default noHardcodedColorsRule;
