# Changelog

## to do list

- using map to select shows location name
- get proper weather icons
- map ignores inputs until left-clicked
- clicking on multiple elements too fast makes the chart pop-up not load
- add windrose graph to wind chart pop-up
- accessibility
- appdata button
- performance mode (disable animations, transparency, background filter sfx)

## [0.3.0] - 2024-12-09

### Fixes
- table backgrounds being mis-aligned
- consistent sizing on table cells
- make background fixed to avoid white backgrounds on different aspect ratios
- table resetting everytime the time changes
- location name breaking location summary

### Changes
- change summary to use same layout system as the day selector (no more tables)
- changing the day keeps the same hour

### Additions
- add visibility, pressure, humidity and UV index to summary
- option to select hour of the day (shows "selected time")
- pressing the local time/selected time header resets selected time
- pressing on weather events displays a graph (click outside the graph to close it)
- added user settings (saved to %appdata%/roaming)
- added default location setting

### Removals
- removed "Today" table

## [0.2.0] - 2024-07-03

### Fixes
- map displayed above titlebar
- content covered by titlebar
- weather icon row too short
- background flashing

### Changes
- show random background based on weather
- blur backgrounds
- move the weather table into tabs
- opaque title bar

## [0.1.0] - 2024-06-29

### Changes
- move local time and currently day/night out of the summary table
- show weather icon in summary table
- fix rain percentage bar in summary table
- map is shown over text elements (on hover)

### Additions
- custom titlebar buttons

## [0.1.0-alpha.4] - 2024-06-28

### Fixes
- data table rows disappearing
- timezone undefined when requesting weather data 
- weather graph/table icons always being "clear weather"

### Changes
- centre all content
- translucent weather graph/table

### Additions
- minimum aspect ratio 
- local time updates alongside main clock
- weather backgrounds 
- weather images

#### map
- map centres on city when loading weather data
- map changes size when focused/unfocused

#### day carousel
- carousel showing smaller more summarised info of each day
- clicking on carousel updates main summary to show info for that day

## [0.1.0-alpha.3] - 2024-06-23

## [0.1.0-alpha.2] - 2024-06-22

### Fixes
- Search results click event handler not working

## [0.1.0-alpha] - 2024-06-21
first pre-release