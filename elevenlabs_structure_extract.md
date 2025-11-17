# ElevenLabs Voice Changer - HTML Structure & Styling Extract

## Core Layout Structure

### HTML Root
```html
<html lang="en" 
      style="--eleven-sidebar-width:16rem; --eleven-sidebar-collapsed:0; --eleven-player-height:0rem; color-scheme:light" 
      data-theme="light">
```

### Body
```html
<body class="rebrand-body flex flex-col min-h-100dvh relative bg-background text-foreground chakra-ui-light __variable_854f3f __variable_dfb837" 
      style="--font-sans:inter; opacity:1; overscroll-behavior:none">
```

## Main Layout Container Hierarchy

```html
<!-- App Root -->
<div id="app-root" class="lg:p-3 min-h-100dvh flex flex-col">
  
  <!-- Toast Container -->
  <div class="Toastify"></div>
  
  <!-- Authenticated Root -->
  <div id="authenticated-root" 
       data-authed="true" 
       class="lg:-m-3 logged-in w-full lg:w-[calc(100%+1.5rem)] flex-1 flex flex-col" 
       style="opacity:1">
    
    <!-- Sidebar (Desktop) -->
    <div aria-expanded="true" 
         class="hidden lg:block fixed h-full left-0 z-[41] cursor-e-resize aria-expanded:cursor-default bg-background/90 transition-[width] duration-150 backdrop-blur-md border-r group/sidebar">
      
      <div class="relative stack w-full h-full pb-3 overflow-hidden scroll-smooth max-h-screen">
        
        <!-- Header with Logo -->
        <div class="hstack justify-between items-center px-3 w-full relative z-20">
          <div class="flex justify-between -mb-4 relative group/header-logo items-center w-full" 
               style="height:var(--eleven-header-height)">
            <!-- Logo content -->
          </div>
        </div>
        
        <!-- Main Navigation -->
        <nav class="flex h-full flex-1 flex-col grow min-h-0" id="main-nav">
          <!-- Nav content -->
        </nav>
      </div>
    </div>
    
    <!-- Main Content Area -->
    <div class="stack min-h-[var(--h-screen-dvh)] max-w-[100vw] pt-[calc(var(--eleven-header-height)+var(--eleven-banner-height))] box-border">
      
      <main class="relative flex-[1_1_0] overflow-hidden">
        <div class="overlay flex flex-col">
          <div class="hstack flex-1 max-h-full">
            
            <!-- Left Panel - Upload/Content Area -->
            <div class="relative @container self-stretch stack grow h-full [--px:1rem] pb-4 xl:[--px:3rem] xl:pb-12 gap-4 2xl:[--px:5rem] 2xl:pb-20 [--max-w:1000px]">
              
              <div class="relative h-full flex-1 min-h-0" 
                   style="--textarea-px:calc(max(50% - 0.5*var(--max-w),0px) + var(--px))">
                
                <!-- Scrollable Content -->
                <div class="flex-1 h-full lg:flex-none relative overflow-y-auto max-h-full py-20 pb-40" 
                     style="padding-inline:calc(max(50% - 0.5*var(--max-w),0px) + var(--px))">
                  
                  <div class="flex justify-center items-center h-full" style="opacity:1">
                    
                    <!-- Upload Area -->
                    <div role="presentation" 
                         tabindex="0" 
                         class="stack items-center justify-center bg-gray-50 h-[248px] rounded-[14px] outline-2 -outline-offset-1 outline-dotted transition-[outline-color] duration-150 outline-gray-300 cursor-pointer w-full max-w-[560px]">
                      
                      <div class="stack items-center py-9" style="opacity:1">
                        <input accept="audio/aac,audio/x-aac,..." 
                               type="file" 
                               multiple 
                               style="display:none" />
                        
                        <div class="h-11 w-11 rounded-[10px] bg-background border border-gray-200 flex items-center justify-center">
                          <!-- Icon -->
                        </div>
                        
                        <p class="text-sm text-foreground font-medium mt-2.5">Click to upload, or drag and drop</p>
                        <p class="text-sm text-subtle font-normal mt-0.5">Audio or video files up to 50MB each</p>
                        
                        <div class="inline-flex items-center text-xs px-2.5 h-6 rounded-full font-medium transition-colors whitespace-nowrap">
                          <button class="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors duration-75 focus-ring disabled:pointer-events-auto data-[loading='true']:!text-transparent border border-gray-alpha-200 hover:bg-gray-alpha-50 active:bg-gray-alpha-100">
                            <!-- Record button -->
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Gradient Overlay -->
                <div class="absolute inset-x-0 bottom-0 h-8 pointer-events-none bg-gradient-to-b from-transparent to-background"></div>
              </div>
              
              <!-- Bottom Controls Area -->
              <div class="mx-auto w-full bg-background stack justify-end relative duration-300 z-20" 
                   style="max-width:var(--max-w); padding-inline:var(--px); transition-property:padding-bottom">
                
                <div class="stack gap-3" style="opacity:1">
                  
                  <!-- Credits and Info Bar -->
                  <div class="hidden md:grid grid-cols-1 @md:grid-cols-[auto,auto] gap-3 justify-between items-center">
                    <div class="relative order-1 @md:order-none flex gap-2 items-center min-w-0">
                      <div class="text-xs text-subtle font-normal min-w-0">
                        <div class="hstack gap-1 md:gap-2 items-center whitespace-nowrap min-w-0">
                          <!-- Progress indicator -->
                          <span class="overflow-hidden overflow-ellipsis">300,000 credits remaining</span>
                        </div>
                      </div>
                    </div>
                    
                    <!-- Action Buttons -->
                    <div class="hstack gap-3 items-center justify-between">
                      <p class="text-xs text-subtle font-normal hstack items-center whitespace-nowrap">0:00 total duration</p>
                      
                      <div class="hstack gap-2 items-center justify-between">
                        <button type="button" 
                                aria-label="Download all" 
                                data-testid="tts-download-all-button" 
                                disabled 
                                class="relative items-center justify-center whitespace-nowrap text-sm font-medium transition-colors duration-75 focus-ring disabled:pointer-events-auto data-[loading='true']:!text-transparent">
                          <!-- Download button -->
                        </button>
                        
                        <button aria-label="Clear queue" 
                                disabled 
                                class="relative items-center justify-center whitespace-nowrap text-sm font-medium transition-colors duration-75 focus-ring disabled:pointer-events-auto data-[loading='true']:!text-transparent bg-background border border-gray-alpha-200 hover:bg-gray-alpha-50 active:bg-gray-alpha-100">
                          <!-- Clear button -->
                        </button>
                        
                        <button aria-label="Generate speech Ctrl+Enter" 
                                disabled 
                                class="relative inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors duration-75 focus-ring disabled:pointer-events-auto data-[loading='true']:!text-transparent bg-foreground text-background shadow-none hover:bg-gray-800 radix-state-open:bg-gray-700 active:bg-gray-700 disabled:bg-gray-400 disabled:text-gray-100 h-9 px-3 rounded-[10px]">
                          Generate speech
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Right Panel - Settings/History -->
            <section class="stack hidden md:flex w-[420px] xl:w-[500px] border-l">
              <div class="stack h-full">
                
                <div class="relative flex-1 min-h-0 overflow-hidden">
                  <div class="w-full h-full overflow-y-auto overflow-x-hidden stack gap-4 p-5 pt-2" 
                       style="opacity:1; visibility:visible; transform:none">
                    
                    <!-- Tabs -->
                    <div dir="ltr" data-orientation="horizontal">
                      <div role="tablist" 
                           aria-orientation="horizontal" 
                           class="inline-flex text-subtle gap-3.5 w-full h-11 pt-0.5 border-b border-gray-alpha-200" 
                           tabindex="0" 
                           data-orientation="horizontal" 
                           style="outline:none">
                        
                        <button type="button" 
                                role="tab" 
                                aria-selected="false" 
                                aria-controls="radix-:r1h3:-content-settings" 
                                data-state="inactive" 
                                id="radix-:r1h3:-trigger-settings" 
                                class="whitespace-nowrap ring-offset-background transition-all focus-ring disabled:pointer-events-none disabled:opacity-50 inline-flex -mb-[1px] items-center justify-center border-b-[1.5px] px-0 py-1 text-sm">
                          Settings
                        </button>
                        
                        <button type="button" 
                                role="tab" 
                                aria-selected="true" 
                                aria-controls="radix-:r1h3:-content-history" 
                                data-state="active" 
                                id="radix-:r1h3:-trigger-history" 
                                class="whitespace-nowrap ring-offset-background transition-all focus-ring disabled:pointer-events-none disabled:opacity-50 inline-flex -mb-[1px] items-center justify-center border-b-[1.5px] px-0 py-1 text-sm">
                          History
                        </button>
                      </div>
                    </div>
                    
                    <!-- Tab Content -->
                    <div class="relative flex-1 min-h-0 mt-2">
                      <div class="h-full absolute top-0 left-0 right-0" style="opacity:1; transform:none">
                        <div class="stack h-full overflow-hidden">
                          
                          <!-- Search/Filter Bar -->
                          <div class="stack gap-1">
                            <div class="hstack gap-2 items-center">
                              
                              <input class="flex border border-gray-alpha-200 bg-transparent shadow-none transition-colors file:border-0 file:bg-transparent file:font-medium placeholder:text-subtle focus-ring focus-visible:border-foreground hover:border-gray-alpha-300 focus-visible:ring-[0.5px] focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50" 
                                     placeholder="Search..." />
                              
                              <div class="hstack gap-2">
                                <button aria-label="Download" 
                                        data-loading="false" 
                                        disabled 
                                        class="relative inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors duration-75 focus-ring disabled:pointer-events-auto data-[loading='true']:!text-transparent bg-background border border-gray-alpha-200 hover:bg-gray-alpha-50 active:bg-gray-alpha-100">
                                  <!-- Download -->
                                </button>
                                
                                <button aria-label="Delete" 
                                        data-loading="false" 
                                        disabled 
                                        class="relative inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors duration-75 focus-ring disabled:pointer-events-auto data-[loading='true']:!text-transparent bg-background border border-gray-alpha-200 hover:bg-gray-alpha-50 active:bg-gray-alpha-100">
                                  <!-- Delete -->
                                </button>
                              </div>
                            </div>
                            
                            <!-- Filter Pills -->
                            <div class="hstack gap-2 py-1 -mb-2 items-center overflow-x-auto w-[calc(100%+2.5rem)] -mx-5 px-5 no-scrollbar">
                              <div tabindex="0" 
                                   class="flex items-center justify-center h-6 rounded-lg whitespace-nowrap text-xs font-medium transition-colors duration-200 cursor-pointer select-none focus-ring px-[calc(theme(space.1)-1px)] border text-foreground bg-background hover:bg-gray-alpha-50 active:bg-gray-alpha-100 inset-ring shrink-0" 
                                   role="button">
                                <div class="w-4 h-4 relative focus-ring rounded-full">
                                  <!-- X Icon -->
                                </div>
                                <div class="pl-0.5 pr-1">Voice</div>
                              </div>
                              
                              <div class="flex items-center h-6 rounded-lg whitespace-nowrap text-xs font-medium px-[calc(theme(space.1)-1px)] border">
                                <div class="pl-0.5 pr-1">Model</div>
                              </div>
                              
                              <div class="flex items-center h-6 rounded-lg whitespace-nowrap text-xs font-medium px-[calc(theme(space.1)-1px)] border">
                                <div class="pl-0.5 pr-1">Date</div>
                              </div>
                            </div>
                          </div>
                          
                          <!-- History List -->
                          <div class="-mx-5 flex-1 stack px-2 md:px-5 scroll-py-12 !overflow-x-hidden" 
                               style="position:relative; overflow:auto">
                            
                            <!-- Sticky gradient header -->
                            <div class="sticky top-[-1px] h-0 z-10 pointer-events-none -mx-5">
                              <div class="h-12 bg-background" 
                                   style="mask-image:linear-gradient(rgb(255,255,255) 0%, rgba(255,255,255,0) 100%); opacity:0; height:3rem">
                              </div>
                            </div>
                            
                            <div class="flex-1" style="opacity:1">
                              <ul class="eleven-list">
                                <!-- List group -->
                                <div role="none" style="opacity:1; height:auto">
                                  <li data-expanded="true" aria-hidden="false">
                                    
                                    <!-- Group Header -->
                                    <div class="eleven-list-item-group hstack items-center gap-3 p-3 border-b text-start w-full outline-gray-alpha-950 py-2 border-transparent top-0 z-10 overflow-visible relative" 
                                         data-expanded="true">
                                      <div class="flex-1">
                                        <div class="hstack justify-center">
                                          <div class="inline-flex items-center text-xs px-2.5 h-6 rounded-full font-medium transition-colors whitespace-nowrap focus-ring border border-transparent text-gray-alpha-950 bg-gray-100">
                                            January 22, 2025
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <!-- List Items -->
                                    <ul class="stack overflow-visible" style="height:auto; opacity:1; display:block">
                                      <ul class="relative pl-[1px] group">
                                        <div role="none" style="opacity:1; height:auto">
                                          <li class="eleven-list-item hstack items-center p-3 gap-3 transition-colors duration-75 relative cursor-pointer group/item rounded-lg">
                                            
                                            <!-- Checkbox -->
                                            <div class="-mr-3">
                                              <div style="width:auto; opacity:1; transform:none">
                                                <button type="button" 
                                                        role="checkbox" 
                                                        aria-checked="false" 
                                                        data-state="unchecked" 
                                                        class="relative peer shrink-0 rounded-md border border-subtle shadow focus-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-gray-alpha-900 data-[state=checked]:text-background h-5 w-5 z-10 block mr-3">
                                                  <div class="checkbox-hitarea overlay -inset-1.5"></div>
                                                </button>
                                              </div>
                                            </div>
                                            
                                            <!-- Item Content Button -->
                                            <button class="text-left absolute inset-0 focus:outline-none focus-visible:ring-[1.5px] ring-inset ring-gray-alpha-950 rounded-lg transition-colors duration-150 md:group-hover/item:bg-gray-alpha-100 max-md:group-hover/item:bg-transparent hover:bg-transparent">
                                            </button>
                                            
                                            <!-- Item Details -->
                                            <div class="relative flex-1 min-w-0 -mt-1">
                                              <div class="relative w-fit line-clamp-1">
                                                <span class="text-sm text-subtle font-normal break-all">No transcript available</span>
                                              </div>
                                              
                                              <div class="flex items-center gap-1 mt-1">
                                                <!-- Avatar -->
                                                <div class="relative w-full h-full rounded-full overflow-hidden bg-background" 
                                                     style="width:0.75rem; min-width:0.75rem; height:0.75rem; min-height:0.75rem">
                                                  <img alt="Grandpa" class="w-full h-full max-w-full max-h-full" 
                                                       style="object-fit:cover; object-position:center center" />
                                                </div>
                                                
                                                <p class="text-xs text-subtle font-normal line-clamp-1 items-center">
                                                  Grandpa · 
                                                  <span>10 months ago</span>
                                                </p>
                                              </div>
                                            </div>
                                          </li>
                                        </div>
                                      </ul>
                                    </ul>
                                  </li>
                                </div>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  </div>
</div>
```

## CSS Variables & Custom Properties

### HTML Level
```css
--eleven-sidebar-width: 16rem;
--eleven-sidebar-collapsed: 0;
--eleven-player-height: 0rem;
color-scheme: light;
```

### Body Level
```css
--font-sans: inter;
opacity: 1;
overscroll-behavior: none;
```

### Component Level
```css
--eleven-header-height: (varies)
--eleven-banner-height: (varies)
--eleven-footer-height: (varies)
--h-screen-dvh: (varies)
--px: 1rem (changes to 3rem on xl, 5rem on 2xl)
--max-w: 1000px
--textarea-px: calc(max(50% - 0.5*var(--max-w),0px) + var(--px))
```

## Key CSS Class Patterns

### Layout Utilities

#### Stack (Vertical Flex Column)
```
stack
stack items-center
stack justify-center
stack gap-3
stack gap-4
stack h-full
```

#### Hstack (Horizontal Flex Row)
```
hstack
hstack gap-2
hstack gap-3
hstack items-center
hstack justify-between
```

#### Flexbox
```
flex
flex flex-col
flex-1
flex items-center
flex justify-center
flex gap-2
```

#### Grid
```
grid
grid-cols-1
@md:grid-cols-[auto,auto]
```

### Spacing

#### Padding
```
p-3
p-5
px-3
px-5
py-1
py-2
py-9
py-20
pb-3
pb-4
pb-12
pb-20
pb-40
pt-2
```

#### Margin
```
m-3
-m-3
-mb-4
-mr-3
-mx-5
mt-1
mt-2
mt-2.5
```

#### Gap
```
gap-1
gap-2
gap-3
gap-3.5
gap-4
```

### Sizing

#### Width
```
w-full
w-11
w-5
w-4
w-[420px]
xl:w-[500px]
w-[calc(100%+1.5rem)]
w-[calc(100%+2.5rem)]
max-w-[560px]
max-w-[100vw]
min-w-0
min-w-36
```

#### Height
```
h-full
h-11
h-6
h-5
h-8
h-9
h-[248px]
min-h-0
min-h-100dvh
min-h-[var(--h-screen-dvh)]
max-h-full
max-h-screen
```

### Borders & Corners
```
border
border-l
border-r
border-b
border-2
border-gray-200
border-gray-alpha-200
border-transparent
rounded-lg
rounded-md
rounded-full
rounded-[10px]
rounded-[14px]
```

### Colors & Backgrounds
```
bg-background
bg-gray-50
bg-gray-100
bg-gray-alpha-50
bg-gray-alpha-100
bg-transparent
text-foreground
text-subtle
text-background
text-gray-alpha-950
```

### Shadows & Effects
```
shadow
shadow-none
backdrop-blur-md
backdrop-blur-[8px]
```

### Transitions & Animations
```
transition-colors
transition-all
transition-transform
transition-[width]
transition-[outline-color]
duration-75
duration-100
duration-150
duration-200
```

### Positioning
```
relative
absolute
fixed
sticky
top-0
left-0
right-0
bottom-0
inset-0
inset-x-0
z-10
z-20
z-[41]
```

### Overflow & Scrolling
```
overflow-hidden
overflow-auto
overflow-y-auto
overflow-x-hidden
overflow-visible
scroll-smooth
no-scrollbar
```

## Button Styles

### Primary Button (Generate/CTA)
```html
<button class="relative inline-flex items-center justify-center 
               whitespace-nowrap text-sm font-medium 
               transition-colors duration-75 focus-ring 
               disabled:pointer-events-auto 
               data-[loading='true']:!text-transparent 
               bg-foreground text-background shadow-none 
               hover:bg-gray-800 
               radix-state-open:bg-gray-700 
               active:bg-gray-700 
               disabled:bg-gray-400 
               disabled:text-gray-100 
               h-9 px-3 rounded-[10px]">
  Generate speech
</button>
```

### Secondary Button (Border)
```html
<button class="relative inline-flex items-center justify-center 
               whitespace-nowrap text-sm font-medium 
               transition-colors duration-75 focus-ring 
               disabled:pointer-events-auto 
               data-[loading='true']:!text-transparent 
               bg-background 
               border border-gray-alpha-200 
               hover:bg-gray-alpha-50 
               active:bg-gray-alpha-100 
               radix-state-open:bg-gray-alpha-100">
  <!-- Content -->
</button>
```

### Tab Button
```html
<button type="button" role="tab" 
        class="whitespace-nowrap ring-offset-background 
               transition-all focus-ring 
               disabled:pointer-events-none 
               disabled:opacity-50 
               inline-flex -mb-[1px] items-center justify-center 
               border-b-[1.5px] px-0 py-1 text-sm">
  Tab Label
</button>
```

## Input Styles

### Text Input
```html
<input class="flex border border-gray-alpha-200 
              bg-transparent shadow-none 
              transition-colors 
              file:border-0 file:bg-transparent file:font-medium 
              placeholder:text-subtle 
              focus-ring 
              focus-visible:border-foreground 
              hover:border-gray-alpha-300 
              focus-visible:ring-[0.5px] 
              focus-visible:ring-offset-0 
              disabled:cursor-not-allowed 
              disabled:opacity-50" 
       placeholder="Search..." />
```

### Checkbox
```html
<button type="button" role="checkbox" 
        aria-checked="false" 
        data-state="unchecked" 
        class="relative peer shrink-0 rounded-md 
               border border-subtle shadow focus-ring 
               disabled:cursor-not-allowed 
               disabled:opacity-50 
               data-[state=checked]:bg-gray-alpha-900 
               data-[state=checked]:text-background 
               h-5 w-5 z-10 block mr-3">
  <div class="checkbox-hitarea overlay -inset-1.5"></div>
</button>
```

### File Input (Hidden)
```html
<input accept="audio/aac,audio/x-aac,..." 
       type="file" 
       multiple 
       style="display:none" />
```

## Badge/Pill Styles

### Filter Pill
```html
<div class="flex items-center justify-center h-6 
            rounded-lg whitespace-nowrap text-xs font-medium 
            transition-colors duration-200 
            cursor-pointer select-none focus-ring 
            px-[calc(theme(space.1)-1px)] 
            border text-foreground bg-background 
            hover:bg-gray-alpha-50 
            active:bg-gray-alpha-100 
            inset-ring shrink-0">
  Label
</div>
```

### Date Badge
```html
<div class="inline-flex items-center text-xs px-2.5 h-6 
            rounded-full font-medium transition-colors 
            whitespace-nowrap focus-ring 
            border border-transparent 
            text-gray-alpha-950 bg-gray-100">
  January 22, 2025
</div>
```

## Upload Area Styles

```html
<div role="presentation" 
     tabindex="0" 
     class="stack items-center justify-center 
            bg-gray-50 
            h-[248px] 
            rounded-[14px] 
            outline-2 
            -outline-offset-1 
            outline-dotted 
            transition-[outline-color] duration-150 
            outline-gray-300 
            cursor-pointer 
            w-full max-w-[560px]">
  <!-- Upload content -->
</div>
```

## Gradient Overlays

### Bottom Fade
```html
<div class="absolute inset-x-0 bottom-0 h-8 
            pointer-events-none 
            bg-gradient-to-b from-transparent to-background">
</div>
```

### Top Fade (with mask)
```html
<div class="sticky top-[-1px] h-0 z-10 pointer-events-none -mx-5">
  <div class="h-12 bg-background" 
       style="mask-image:linear-gradient(rgb(255,255,255) 0%, rgba(255,255,255,0) 100%)">
  </div>
</div>
```

## Responsive Breakpoints

Based on the class patterns observed:
- `md:` - Medium screens and up
- `lg:` - Large screens and up
- `xl:` - Extra large screens and up
- `2xl:` - 2X large screens and up
- `max-md:` - Below medium screens
- `max-[1023px]:` - Custom breakpoint
- `@container` - Container queries
- `@md:` - Container query medium

## Focus & Interaction States

### Focus Ring
```
focus-ring
focus-visible:ring-[1.5px]
focus-visible:ring-[0.5px]
ring-offset-background
ring-inset
```

### Hover States
```
hover:bg-gray-alpha-50
hover:bg-gray-800
hover:border-gray-alpha-300
md:group-hover/item:bg-gray-alpha-100
```

### Active States
```
active:bg-gray-alpha-100
active:bg-gray-700
```

### Disabled States
```
disabled:pointer-events-auto
disabled:opacity-50
disabled:cursor-not-allowed
disabled:bg-gray-400
disabled:text-gray-100
```

### Data States
```
data-[loading='true']:!text-transparent
data-[state=checked]:bg-gray-alpha-900
data-state="active"
data-state="inactive"
aria-expanded="true"
aria-selected="true"
```

## Typography

### Font Sizes
```
text-xs
text-sm
```

### Font Weights
```
font-normal
font-medium
```

### Text Colors
```
text-foreground
text-background
text-subtle
text-gray-alpha-950
```

### Line Clamping
```
line-clamp-1
overflow-ellipsis
whitespace-nowrap
break-all
```

## Layout Tricks

### Centering
```html
<div class="flex justify-center items-center h-full">
```

### Two-Column with Auto Sizing
```html
<div class="grid grid-cols-1 @md:grid-cols-[auto,auto] gap-3 justify-between items-center">
```

### Negative Margins for Bleed
```html
<div class="-mx-5 px-5">
  <!-- Content bleeds to edges but has padding -->
</div>
```

### Dynamic Max Width with Padding
```css
max-width: var(--max-w);
padding-inline: var(--px);
padding-inline: calc(max(50% - 0.5*var(--max-w), 0px) + var(--px));
```

## Z-Index Layers
- `z-10` - Overlay elements, sticky headers
- `z-20` - Navigation, controls
- `z-[41]` - Sidebar (desktop)
- `z-[9999]` - Toast notifications (from CSS var)

## Notes

1. **Utility-First Approach**: Heavy use of Tailwind CSS utility classes
2. **Custom Classes**: Some custom classes like `stack`, `hstack`, `eleven-list`, `eleven-list-item`
3. **CSS Variables**: Extensive use of CSS custom properties for theming and responsive values
4. **Group Modifiers**: Advanced group hover/focus states (e.g., `group/sidebar`, `group/item`)
5. **Container Queries**: Using `@container` and `@md:` for container-based responsive design
6. **Radix UI**: Tab components use Radix UI patterns (radix-state-open, data-state, etc.)
7. **Focus Management**: Sophisticated focus ring and keyboard navigation support
8. **Dark Mode Ready**: Uses semantic colors like `bg-background`, `text-foreground`
9. **Animation**: Smooth transitions with duration controls (75ms, 150ms, 200ms)
10. **Accessibility**: Proper ARIA labels, roles, and semantic HTML

