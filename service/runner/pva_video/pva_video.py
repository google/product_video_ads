# Copyright 2024 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#   https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Wrappers for ffmpeg and ImageMagick to overlay assets on videos.

Provides functions to generate command-line arguments and execute ffmpeg
for overlaying images and text onto a source video file. Text is rendered
to temporary images using ImageMagick's 'convert' tool. Rotation for text
is handled by ffmpeg.
"""

import logging
import os
import subprocess
import tempfile
from typing import Any, Dict, List, Optional, Tuple, Union

DEFAULT_FADE_DURATION: float = 0.1
AUTO_DIMENSION: str = "-1"  # Used for ffmpeg scale filter dimension
IMAGE_MAGICK_EXECUTABLE: str = "convert"
FFMPEG_EXECUTABLE: str = "ffmpeg"
TEXT_RENDER_SCALE_FACTOR: int = 4  # Render text larger for better anti-aliasing


class ExternalCommandError(Exception):
  """Base class for errors executing external commands like ffmpeg or convert."""

  def __init__(self, command: List[str], output: Union[str, bytes]):
    """Initializes the exception.

    Args:
      command: The command arguments list that was executed.
      output: The stderr/stdout output from the failed command.
    """
    self.command_str = " ".join(command)
    if isinstance(output, bytes):
      try:
        self.output = output.decode("utf-8", errors="replace")
      except Exception:
        self.output = repr(output)  # Fallback if decode fails
    else:
      self.output = output
    message = (
        f"Command failed:\n"
        f"Command: {self.command_str}\n"
        f"Output:\n{self.output}"
    )
    super().__init__(message)


class ImageMagickExecutionError(ExternalCommandError):
  """Exception raised for errors during ImageMagick 'convert' execution."""


class FFMpegExecutionError(ExternalCommandError):
  """Exception raised for errors during ffmpeg execution."""


def _run_command(
    args: List[str], error_class: type[ExternalCommandError]
) -> str:
  """Executes a command using subprocess and handles errors.

  Args:
    args: A list of command-line arguments.
    error_class: The specific exception class to raise on error.

  Returns:
    The combined stdout/stderr output of the command as a string.

  Raises:
    error_class: If the command returns a non-zero exit code.
    FileNotFoundError: If the executable is not found.
  """
  logging.debug("Running command: %s", " ".join(args))
  try:
    # Using text=True for automatic decoding, capture_output for convenience
    process = subprocess.run(
        args,
        check=True,  # Raises CalledProcessError on non-zero exit
        capture_output=True,
        text=True,
        encoding="utf-8",  # Crucial for handling text correctly
        errors="replace",  # Handle potential encoding issues in output
    )
    output = process.stdout + process.stderr
    if output:
      logging.debug("Command output:\n%s", output)
    return output
  except subprocess.CalledProcessError as e:
    # Combine stdout and stderr for the error message
    output = (e.stdout or "") + (e.stderr or "")
    logging.error("Command '%s' failed with output: %s", " ".join(args), output)
    raise error_class(args, output) from e
  except FileNotFoundError as e:
    logging.error("Executable not found for command: %s", " ".join(args))
    # Raise the specific error class, indicating the command failed
    raise error_class(args, f"Executable '{args[0]}' not found.") from e
  except Exception as e:
    # Catch other potential subprocess errors
    logging.exception("Unexpected error running command: %s", " ".join(args))
    raise error_class(args, f"Unexpected error: {e}") from e


def _write_text_to_temp_image(
    text: str,
    font: Optional[str],
    font_size: Union[int, float],
    font_color: str,
    executable: str = IMAGE_MAGICK_EXECUTABLE,
) -> str:
  """Renders text horizontally to a temporary PNG image using ImageMagick.

  Note: Text rotation is handled by ffmpeg, not here.
  Please ensure the provided font supports any special characters in the text.

  Args:
    text: The text content to render (expected to be UTF-8).
    font: The path to the font file or font name.
    font_size: The font size (will be multiplied by TEXT_RENDER_SCALE_FACTOR).
    font_color: The font color (e.g., 'black', '#FF0000').
    executable: Path to the ImageMagick 'convert' executable.

  Returns:
    The path to the created temporary PNG file.

  Raises:
    ImageMagickExecutionError: If the 'convert' command fails.
  """
  if not text:
    text = " "  # Avoid empty label error in ImageMagick

  # Create a temporary file path but don't open it yet
  # ImageMagick will create the file. We need the name.
  temp_file_handle = None
  try:
    # Use NamedTemporaryFile to get a unique name securely
    temp_file_handle = tempfile.NamedTemporaryFile(
        prefix="pva_text_", suffix=".png", delete=False
    )
    temp_file_name = temp_file_handle.name
    temp_file_handle.close(
    )  # Close immediately, ImageMagick will write to the path
    temp_file_handle = None  # Prevent context manager from deleting later

  except Exception as e:
    # Handle potential errors during temp file creation
    logging.exception("Failed to create temporary file name for text image.")
    raise ImageMagickExecutionError([], f"Failed to create temp file name: {e}"
                                   ) from e
  finally:
    # Ensure handle is closed if something went wrong after creation
    # # before close()
    if temp_file_handle:
      temp_file_handle.close()

  args = [executable]
  # Specify UTF-8 encoding interpretation for the text label
  # Use 'Unicode' as it's generally well-supported by ImageMagick for UTF-8
  args.extend(["-encoding", "Unicode"])
  args.extend(["-background", "transparent", "-colorspace", "sRGB"])
  if font:
    args.extend(["-font", font])

  # Render at larger size for better downscaling quality
  scaled_font_size = float(font_size) * TEXT_RENDER_SCALE_FACTOR
  args.extend(["-pointsize", str(scaled_font_size)])
  args.extend(["-fill", font_color])

  # Gravity helps with positioning multi-line text if '\n' is used, then trim.
  args.extend(["-gravity", "center"])

  # Use 'label:' to interpret text content directly
  args.append(f"label:{text}")

  # Trim transparent borders - essential for accurate positioning later
  args.extend(["-trim"])

  args.append(temp_file_name)  # Output path

  try:
    _run_command(args, ImageMagickExecutionError)
  except ImageMagickExecutionError as e:
    # Clean up the potentially empty/invalid temp file if convert failed
    if os.path.exists(temp_file_name):
      try:
        os.remove(temp_file_name)
      except OSError:
        logging.warning(
            "Could not remove temp text file after error: %s", temp_file_name
        )
    raise e  # Re-raise the original error

  return temp_file_name


def _generate_text_filter(
    stream_index: int,
    text: str,
    font: Optional[str],
    font_size: Union[int, float],
    font_color: str,
) -> Tuple[str, str]:
  """Generates an ffmpeg filter segment for a text overlay (via temp image).

  Args:
    stream_index: The index of the temporary text image input stream for ffmpeg.
    text: The text to overlay.
    font: Font name or path. Ensure it supports needed characters.
    font_size: Font size.
    font_color: Font color.

  Returns:
    A tuple containing:
      - The ffmpeg filter string segment (e.g., "[N:v] scale... [vidN];").
      - The path to the temporary image file created. The caller must manage
        deletion of this file.

  Raises:
    ImageMagickExecutionError: If creating the temporary text image fails.
  """
  # Rotation is removed here; will be handled by ffmpeg's overlay filter
  temp_image_path = _write_text_to_temp_image(
      text=text,
      font=font,
      font_size=font_size,
      font_color=font_color,
      # No angle passed here
  )

  input_stream_name = f"[{stream_index}:v]"
  output_stream_name = f"[vid{stream_index}]"

  # Scale down the high-resolution text image for anti-aliasing
  # iw = input width, ih = input height
  scale_filter = (
      f"scale=iw/{TEXT_RENDER_SCALE_FACTOR}:ih/{TEXT_RENDER_SCALE_FACTOR}"
  )
  filter_str = f"{input_stream_name} {scale_filter} {output_stream_name};"

  return filter_str, temp_image_path


def _generate_overlay_filter(
    input_stream: str,
    overlay_stream_index: int,
    x: Union[int, float, str],
    y: Union[int, float, str],
    width: Union[int, float, str],
    height: Union[int, float, str],
    start_time: Union[int, float],
    end_time: Union[int, float],
    output_stream: str,
    angle: Optional[Union[int, float]],
    fade_in_duration: float,
    fade_out_duration: float,
    align: Optional[str],
    keep_ratio: bool,
) -> str:
  """Generates an ffmpeg filter segment for overlaying an image/video stream.

  Args:
    input_stream: Name of the base video stream (e.g., "0:v", "[prev_out]").
    overlay_stream_index: Index of the overlay input stream (e.g., 1, 2).
    x: Horizontal position (pixels or ffmpeg expression like 'main_w-overlay_w').
    y: Vertical position (pixels or ffmpeg expression).
    width: Target width (pixels or AUTO_DIMENSION for auto).
    height: Target height (pixels or AUTO_DIMENSION for auto).
    start_time: Time (seconds) when the overlay appears.
    end_time: Time (seconds) when the overlay disappears.
    output_stream: Name for the output stream (e.g., "[out1]").
    angle: Rotation angle in degrees. Applied by ffmpeg.
    fade_in_duration: Duration (seconds) of the fade-in effect.
    fade_out_duration: Duration (seconds) of the fade-out effect.
    align: Text alignment ('left', 'center', 'right') used to adjust 'x'.
    keep_ratio: If True, maintain aspect ratio during scaling.

  Returns:
    The ffmpeg filter string segment for this overlay operation.
  """
  # Name assigned in generate_complex_filter
  overlay_input = f"[vid{overlay_stream_index}]"
  scaled_stream = f"[vid{overlay_stream_index}scaled]"
  rotated_stream = f"[vid{overlay_stream_index}rotated]"
  fade_in_stream = f"[vid{overlay_stream_index}fadein]"
  fade_out_stream = f"[vid{overlay_stream_index}fadeout]"
  final_output_stream_name = f"[{output_stream}]" if output_stream else ""

  # --- 1. Scaling ---
  scale_str = f"{overlay_input} format=rgba"  # Ensure alpha channel
  w_str = str(width)
  h_str = str(height)

  if keep_ratio:
    # Use iw/ih for input width/height in expression
    # Adjusted expression to handle potential division by zero if h_str is '0' or '-1' etc.
    # Using max(1, H) to avoid division by zero errors in aspect ratio calculation.
    # Note: ffmpeg scale filter handles '-1' correctly internally.
    safe_h_str = f"max(1,{h_str})"  # Prevent division by zero in aspect ratio comparison
    scale_filter = (
        f"scale='if(gt(iw/ih,{w_str}/{safe_h_str}),{w_str},{AUTO_DIMENSION})':"
        f"'if(gt(iw/ih,{w_str}/{safe_h_str}),{AUTO_DIMENSION},{h_str})':"
        "force_original_aspect_ratio=decrease"
    )  # Ensure it fits
    # Adjust y/x to center within the original target box if keeping ratio
    y_adjusted = f"{y}+({h_str}-overlay_h)/2"
    x_adjusted = f"{x}+({w_str}-overlay_w)/2"
  else:
    scale_filter = f"scale={w_str}:{h_str}"
    y_adjusted = str(y)
    x_adjusted = str(x)

  scale_str += f",{scale_filter} {scaled_stream};"
  logging.debug("Scale filter segment: %s", scale_str)

  # --- 2. Rotation (Applied in ffmpeg now for both images and text) ---
  rotation_str = ""
  current_stream_after_scale = scaled_stream
  current_stream_after_rotate = rotated_stream  # Default output name if rotation happens

  if angle and float(angle) != 0:
    # Rotate requires radians, specify 'none' for transparent background fill
    # ow/oh adjust output canvas size based on rotated dimensions using hypotenuse
    # This ensures the rotated content isn't clipped.
    # Use iw, ih of the *scaled* stream for calculation.
    rotation_str = (
        f"{current_stream_after_scale} rotate={angle}*PI/180:"
        f"ow=hypot(iw,ih):oh=ow:c=none {current_stream_after_rotate};"
    )
    logging.debug("Rotate filter segment: %s", rotation_str)
  else:
    # If no rotation, just pass the scaled stream through using 'copy'
    rotation_str = f"{current_stream_after_scale} copy {current_stream_after_rotate};"
    # Note: We still use current_stream_after_rotate name for consistency downstream

  # --- 3. Fading ---
  fade_in_applied = False
  fade_str = ""
  # Start fading from the stream *after* potential rotation
  current_stream_before_fade = current_stream_after_rotate

  if float(fade_in_duration) > 0:
    fadein_start = float(start_time)
    fade_str += (
        f"{current_stream_before_fade} fade=t=in:st={fadein_start}:"
        f"d={fade_in_duration}:alpha=1 {fade_in_stream};"
    )
    current_stream_before_fade = fade_in_stream  # Output of fade in
    fade_in_applied = True
  else:
    # If no fade-in, pass the current stream
    fade_str += f"{current_stream_before_fade} copy {fade_in_stream};"
    current_stream_before_fade = fade_in_stream  # Keep name consistent

  # Apply fade out to the stream *after* potential fade in
  current_stream_after_fade_in = current_stream_before_fade

  if float(fade_out_duration) > 0:
    # Fade out starts N seconds before the end time
    fadeout_start = float(end_time) - float(fade_out_duration)
    # Ensure fadeout doesn't start before fadein finishes or start time
    fadeout_start = max(
        fadeout_start,
        float(start_time) + float(fade_in_duration if fade_in_applied else 0)
    )
    # Ensure fadeout doesn't start before it should end (clamp if duration is too long)
    fadeout_start = min(
        fadeout_start,
        float(end_time) - float(fade_out_duration)
    )
    fade_str += (
        f"{current_stream_after_fade_in} fade=t=out:st={fadeout_start}:"
        f"d={fade_out_duration}:alpha=1 {fade_out_stream};"
    )
    current_stream_after_fade_in = fade_out_stream  # Output of fade out
  else:
    # If no fade-out, pass the current stream
    fade_str += f"{current_stream_after_fade_in} copy {fade_out_stream};"
    current_stream_after_fade_in = fade_out_stream  # Keep name consistent

  logging.debug("Fade filter segment: %s", fade_str)

  # --- 4. Overlay ---
  # Adjust x based on alignment AFTER scaling/rotation
  # These use the dimensions (overlay_w, overlay_h) of the stream *being
  # overlaid* which is the potentially scaled, rotated, and faded stream
  # (`current_stream_after_fade_in`)
  if align == "center":
    x_final = f"{x_adjusted}-overlay_w/2"
  elif align == "right":
    x_final = f"{x_adjusted}-overlay_w"
  else:  # Default 'left'
    x_final = x_adjusted

  overlay_enable = f"enable='between(t,{start_time},{end_time})'"
  overlay_str = (
      # Combine base stream and processed overlay stream
      f"[{input_stream}]{current_stream_after_fade_in} "
      f"overlay={x_final}:{y_adjusted}:{overlay_enable} "
      f"{final_output_stream_name}"
  )
  logging.debug("Overlay filter segment: %s", overlay_str)

  # Combine all parts for this overlay operation
  full_filter = scale_str + rotation_str + fade_str + overlay_str
  return full_filter


def generate_complex_filter(
    image_overlays: List[Dict[str, Any]], text_overlays: List[Dict[str, Any]]
) -> Tuple[List[str], List[Dict[str, Any]], str]:
  """Generates the ffmpeg complex filter spec and temporary text image list.

  Args:
    image_overlays: List of dictionaries, each defining an image overlay.
      Required keys: 'image', 'x', 'y', 'start_time', 'end_time'.
      Optional keys: 'width', 'height', 'angle', 'fade_in_duration',
                     'fade_out_duration', 'keep_ratio'.
    text_overlays: List of dictionaries, each defining a text overlay.
      Required keys: 'text', 'font_size', 'font_color', 'align',
                     'x', 'y', 'start_time', 'end_time'.
      Optional keys: 'font', 'angle', 'fade_in_duration', 'fade_out_duration'.
                     Font should support required characters.

  Returns:
    A tuple containing:
      - filter_parts: A list of strings, each a segment of the complex filter.
      - temp_text_images: A list of dicts {'path': str, 'start_time': float,
                          'end_time': float} for created temporary text images.
                          The caller is responsible for deleting these files.
      - final_video_stream_name: The name of the final video output stream
                                 (e.g., "[outN]" or "0:v").
  """
  filter_parts: List[str] = []
  temp_text_images: List[Dict[str, Any]] = []
  # Combine overlays, ensuring consistent processing order
  overlays = [("image", o) for o in image_overlays
             ] + [("text", o) for o in text_overlays]

  current_input_stream = "0:v"  # Start with the main video input
  final_output_stream_name = current_input_stream  # Default if no overlays

  for i, (overlay_type, overlay_spec) in enumerate(overlays):
    # ffmpeg input indices start from 0 (video), overlays from 1
    stream_index = i + 1
    output_stream_name = f"out{i}"
    # Update for next iteration or final mapping
    final_output_stream_name = f"[{output_stream_name}]"

    angle = overlay_spec.get("angle")  # Get angle for both types

    if overlay_type == "text":
      # Generate image from text using ImageMagick (no rotation here)
      text_filter_str, temp_img_path = _generate_text_filter(
          stream_index=stream_index,
          text=overlay_spec["text"],
          font=overlay_spec.get("font"),  # Allow font to be optional
          font_size=overlay_spec["font_size"],
          font_color=overlay_spec["font_color"],
          # No angle passed to text filter generation
      )
      filter_parts.append(text_filter_str)
      temp_text_images.append({
          "path": temp_img_path,
          "start_time": overlay_spec["start_time"],
          "end_time": overlay_spec["end_time"],
      })
      # Angle is now handled by ffmpeg overlay filter below
    else:  # Is image overlay
      # Simple rename filter for image input
      image_input_stream = f"[{stream_index}:v]"
      image_vid_stream = f"[vid{stream_index}]"
      filter_parts.append(f"{image_input_stream} copy {image_vid_stream};")
      # Angle handled by ffmpeg overlay filter below

    # Generate the main overlay filter (scale, rotate, fade, overlay)
    # Angle is now passed for both text and images to be handled here.
    overlay_filter_str = _generate_overlay_filter(
        input_stream=current_input_stream,
        overlay_stream_index=stream_index,
        x=overlay_spec["x"],
        y=overlay_spec["y"],
        width=overlay_spec.get("width", AUTO_DIMENSION),
        height=overlay_spec.get("height", AUTO_DIMENSION),
        start_time=overlay_spec["start_time"],
        end_time=overlay_spec["end_time"],
        output_stream=output_stream_name,
        angle=angle,  # Pass angle for ffmpeg rotation
        fade_in_duration=overlay_spec.get(
            "fade_in_duration", DEFAULT_FADE_DURATION
        ),
        fade_out_duration=overlay_spec.get(
            "fade_out_duration", DEFAULT_FADE_DURATION
        ),
        align=overlay_spec.get("align"),  # Often relevant for text
        keep_ratio=overlay_spec.get(
            "keep_ratio", False
        ),  # Default False for text, can be true for images
    )
    filter_parts.append(overlay_filter_str)

    # The output of this overlay becomes the input for the next one
    current_input_stream = final_output_stream_name

  return filter_parts, temp_text_images, final_output_stream_name


def generate_input_args(
    image_overlays: List[Dict[str, Any]],
    temp_text_images: List[Dict[str, Any]],
    resize_pngs: bool = True,
    resize_executable: str = IMAGE_MAGICK_EXECUTABLE,
) -> Tuple[List[str], List[str]]:
  """Generates ffmpeg input arguments (-i, -loop, -t, etc.) for overlays.

  Args:
    image_overlays: List of image overlay dictionaries.
    temp_text_images: List of temporary text image dictionaries from
                      generate_complex_filter.
    resize_pngs: If True, resize source PNGs using ImageMagick before ffmpeg.
                 Writes resized images to temporary files.
    resize_executable: Path to the ImageMagick 'convert' executable.


  Returns:
      A tuple containing:
        - input_args: A list of ffmpeg command line arguments for inputs.
        - temp_resized_image_paths: A list of paths to temporarily resized
                                    images that need cleanup.
  """
  input_args: List[str] = []
  temp_resized_image_paths: List[str] = []
  processed_images: set[str] = set()  # Track originals to avoid re-resizing

  # Combine overlays in the correct order matching filter indices
  combined_inputs = [("image", o) for o in image_overlays
                    ] + [("text", o) for o in temp_text_images]

  for overlay_type, overlay_data in combined_inputs:
    if overlay_type == "image":
      filename = overlay_data["image"]
      start_time = float(overlay_data["start_time"])
      end_time = float(overlay_data["end_time"])
      duration = max(0.01, end_time - start_time)  # Ensure positive duration

      is_gif = filename.lower().endswith(".gif")
      has_fade = (
          float(overlay_data.get("fade_in_duration", 0))
          + float(overlay_data.get("fade_out_duration", 0))
      ) > 0

      current_filename = filename
      # Optimization: Resize PNGs beforehand if requested
      if (
          resize_pngs and filename not in processed_images
          and filename.lower().endswith(".png")
          and ("width" in overlay_data or "height" in overlay_data)
      ):
        temp_resized_handle = None
        try:
          temp_resized_handle = tempfile.NamedTemporaryFile(
              prefix="pva_resized_", suffix=".png", delete=False
          )
          resized_path = temp_resized_handle.name
          temp_resized_handle.close()  # Close handle, resize writes to path
          temp_resized_handle = None

          # Construct resize dimensions string carefully
          target_w = overlay_data.get("width", "")
          target_h = overlay_data.get("height", "")
          resize_dims = f'{target_w}x{target_h}'
          # Suffix: '>' prevents upscale, '!' forces exact size if not keep_ratio
          resize_suffix = '>' if overlay_data.get("keep_ratio") else '!'
          # Avoid adding suffix if dims are empty/invalid? IM might handle it.

          _run_command(
              [
                  resize_executable,
                  filename,  # Input
                  "-resize",
                  f'{resize_dims}{resize_suffix}',
                  "-quality",
                  "95",
                  "-depth",
                  "8",
                  resized_path  # Output
              ],
              ImageMagickExecutionError,
          )
          current_filename = resized_path  # Use the resized file path
          temp_resized_image_paths.append(resized_path)
          processed_images.add(filename)  # Mark original as processed

        except ImageMagickExecutionError as e:
          logging.warning(
              "Failed to resize image '%s', using original.Error: %s", filename,
              e
          )
          current_filename = filename
          processed_images.add(filename)  # Mark original as attempted
          # Clean up empty temp file if resize failed after creation
          if resized_path and os.path.exists(resized_path):
            try:
              os.remove(resized_path)
            except OSError:
              pass
        except Exception as e:  # Catch temp file creation errors etc.
          logging.warning(
              "Unexpected error resizing image '%s', using original. Error: %s",
              filename, e
          )
          current_filename = filename
          processed_images.add(filename)
        finally:
          if temp_resized_handle:  # Ensure handle is closed
            temp_resized_handle.close()

      # --- Generate FFMPEG args for this image input ---
      overlay_input_args: List[str] = []

      if is_gif and not has_fade:
        overlay_input_args.extend(["-ignore_loop",
                                   "0"])  # Respect GIF loop count
      else:
        overlay_input_args.extend(["-loop",
                                   "1"])  # Loop static images/GIFs with fade

      overlay_input_args.extend(["-itsoffset", str(start_time)])
      overlay_input_args.extend(["-t", str(duration)])

      if is_gif:
        overlay_input_args.extend(["-c:v", "gif"])

      overlay_input_args.extend(["-i", current_filename])
      input_args.extend(overlay_input_args)

    elif overlay_type == "text":
      # --- Generate FFMPEG args for this text input ---
      path = overlay_data["path"]
      start_time = float(overlay_data["start_time"])
      end_time = float(overlay_data["end_time"])
      duration = max(0.01, end_time - start_time)

      text_input_args: List[str] = []
      # Text images are always treated as static looped images
      text_input_args.extend(["-f", "image2", "-loop", "1"])
      text_input_args.extend(["-itsoffset", str(start_time)])
      text_input_args.extend(["-t", str(duration)])
      text_input_args.extend(["-i", path])
      input_args.extend(text_input_args)

  return input_args, temp_resized_image_paths


def run_video_generation(
    input_video: str,
    output_video: str,
    image_overlays: List[Dict[str, Any]],
    text_overlays: List[Dict[str, Any]],
    ffmpeg_executable: str = FFMPEG_EXECUTABLE,
    imagemagick_executable: str = IMAGE_MAGICK_EXECUTABLE,
) -> None:
  """Generates the video with overlays using ffmpeg.

  Manages temporary file creation and cleanup.

  Args:
    input_video: Path to the source video file.
    output_video: Path where the output video will be saved.
    image_overlays: List of image overlay dictionaries.
    text_overlays: List of text overlay dictionaries.
    ffmpeg_executable: Path to the ffmpeg executable.
    imagemagick_executable: Path to the ImageMagick 'convert' executable.

  Raises:
    FFMpegExecutionError: If the ffmpeg command fails.
    ImageMagickExecutionError: If any ImageMagick command fails.
    FileNotFoundError: If executables or input video are not found.
    Exception: For other unexpected errors (e.g., file system issues).
  """
  temp_text_image_paths: List[str] = []
  temp_resized_image_paths: List[str] = []

  try:
    # 1. Generate the complex filter graph and create temporary text images
    logging.info("Generating complex filter and temporary text images...")
    filter_parts, temp_text_images, final_video_stream = generate_complex_filter(
        image_overlays, text_overlays
    )
    # Keep track of temp files for cleanup
    temp_text_image_paths = [img["path"] for img in temp_text_images]

    # 2. Generate input arguments for ffmpeg, potentially resizing images
    logging.info("Generating ffmpeg input arguments...")
    input_args, temp_resized_paths = generate_input_args(
        image_overlays,
        temp_text_images,
        resize_pngs=True,  # Enable resize optimization
        resize_executable=imagemagick_executable
    )
    temp_resized_image_paths = temp_resized_paths  # Track for cleanup

    # 3. Construct and run the final ffmpeg command
    ffmpeg_args = [ffmpeg_executable]
    # Input video is always first (-i input_video maps to 0:v, 0:a)
    ffmpeg_args.extend(["-i", input_video])
    # Add generated input args for overlays (in the correct order)
    ffmpeg_args.extend(input_args)

    if filter_parts:
      # Join filter segments with ';'
      complex_filter = "".join(filter_parts)
      # Remove trailing ';' if present
      complex_filter = complex_filter.rstrip(';')
      ffmpeg_args.extend(["-filter_complex", complex_filter])
      # Map the final video stream from the filter graph
      ffmpeg_args.extend(["-map", final_video_stream])
    else:
      # If no filters, map the original video stream
      ffmpeg_args.extend(["-map", "0:v"])

    # Map audio from the original input video if it exists ('?' makes it optional)
    ffmpeg_args.extend(["-map", "0:a?"])

    # Output settings
    # -shortest: Finish encoding when the shortest input stream ends
    # -y: Overwrite output file without asking
    ffmpeg_args.extend(["-shortest", "-y"])
    # Optional: Specify codecs if needed, e.g. -c:v libx264 -c:a aac
    # Add '-movflags +faststart' for web video streaming optimization
    ffmpeg_args.extend(["-movflags", "+faststart"])
    # Consider adding a video codec and quality/preset setting, e.g.:
    # ffmpeg_args.extend(["-c:v", "libx264", "-preset", "medium", "-crf", "23"])
    # ffmpeg_args.extend(["-c:a", "aac", "-b:a", "128k"]) # Example audio codec

    ffmpeg_args.append(output_video)

    logging.info("Running ffmpeg command...")
    ffmpeg_output = _run_command(ffmpeg_args, FFMpegExecutionError)
    logging.info("FFmpeg execution completed successfully.")
    logging.debug('ffmpeg ran with output: %s', ffmpeg_output)

  finally:
    # 4. Cleanup all temporary files created by this module
    logging.debug("Cleaning up temporary files created by pva_video...")
    all_temp_files = temp_text_image_paths + temp_resized_image_paths
    for temp_file in all_temp_files:
      if os.path.exists(temp_file):
        try:
          os.remove(temp_file)
          logging.debug("Removed pva_video temp file: %s", temp_file)
        except OSError as e:
          logging.warning(
              "Failed to remove pva_video temporary file: %s. Error: %s",
              temp_file, e
          )
