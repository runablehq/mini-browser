# VHS tape for mini-browser demo
# https://github.com/charmbracelet/vhs

Output assets/demo.gif

Set Shell "bash"
Set FontSize 14
Set Width 860
Set Height 460
Set Padding 16
Set Theme "GitHub Dark"
Set TypingSpeed 30ms
Set CursorBlink false

Sleep 500ms

# Install the skill
Type "npx skills add runablehq/mini-browser --all --global"
Enter
Sleep 5s

# List installed skills
Type "npx skills ls"
Enter
Sleep 3s

# Start Chrome
Type "mb-start-chrome"
Enter
Sleep 3s

# Navigate
Type "mb go https://example.com"
Enter
Sleep 3s

# Extract text
Type "mb text h1"
Enter
Sleep 2s

# Snap interactive elements
Type "mb snap"
Enter
Sleep 2s

# Screenshot
Type "mb shot screenshot.png"
Enter
Sleep 2s

Sleep 1s
