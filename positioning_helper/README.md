# PVA Positioning helper

This lightweight javascript/html helper allows users to visually drag and drop
elements on a video frame, in order to determine the positioning, width and height values for PVA configuration.

## Usage Instructions

- Load the video using the button provided. Once video is loaded, you can scroll manually to the desired frame.
- Name and insert all the placeholder elements that you need.
  > Note: There are two types of placeholders: `Image` and `Text`. The reported co-ordinates for image are centered to the box whereas for text, they are top left corner of the box. This is intentional as PVA treats image positioning from image center.
- The newly inserted placeholder elements are displayed at top left corner of the video. You can drag and move them around. To resize, simply drag the element from the bottom right corner.
- Once satisfied with the positioning, copy over the values from the positioning cards into your PVA `Placements` sheet.
