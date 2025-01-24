/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Sheets } from './sheetManagement';
import { SheetName, ColumnName, ElementType } from './structure';

interface Rectangle {
  element: HTMLDivElement;
  dataFieldName: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

class VideoPlacements {
  private videoFile: HTMLInputElement;
  private myVideo: HTMLVideoElement;
  // private frameSlider: HTMLInputElement;
  private videoContainer: HTMLDivElement;
  private coordinatesContainer: HTMLDivElement;
  private placementIdsInput: HTMLSelectElement;
  private generateRectanglesButton: HTMLButtonElement;

  private rectangles: Rectangle[] = [];
  private videoWidth: number = 0;
  private videoHeight: number = 0;

  constructor(
    readonly placements: Record<string, PlacementItemVisualConfig[]>
  ) {
    console.log('VideoPlacements constructor');
    this.videoFile = document.getElementById('videoFile') as HTMLInputElement;
    this.myVideo = document.getElementById('myVideo') as HTMLVideoElement;
    this.videoContainer = document.getElementById(
      'video-container'
    ) as HTMLDivElement;
    this.coordinatesContainer = document.getElementById(
      'coordinates-container'
    ) as HTMLDivElement;
    this.placementIdsInput = document.getElementById(
      'placementIds'
    ) as HTMLSelectElement;
    this.generateRectanglesButton = document.getElementById(
      'generateRectangles'
    ) as HTMLButtonElement;

    this.addEventListeners();
  }

  private addEventListeners(): void {
    this.videoFile.addEventListener(
      'change',
      this.handleVideoFileChange.bind(this)
    );
    this.myVideo.addEventListener(
      'loadedmetadata',
      this.handleVideoMetadata.bind(this)
    );
    this.placementIdsInput.addEventListener(
      'change',
      this.reloadPlacementVisuals.bind(this)
    );
    this.generateRectanglesButton.addEventListener(
      'click',
      this.reloadPlacementVisuals.bind(this)
    );
  }

  private handleVideoFileChange(e: Event): void {
    const file = (e.target as HTMLInputElement).files![0];
    const fileUrl = URL.createObjectURL(file);
    this.myVideo.src = fileUrl;
    this.myVideo.load();
  }

  private handleVideoMetadata(): void {
    this.videoWidth = this.myVideo.videoWidth;
    this.videoHeight = this.myVideo.videoHeight;
    console.log('Video Dimensions:', this.videoWidth, this.videoHeight);
  }

  public reloadPlacementVisuals(): void {
    console.log('reloadPlacementVisuals');
    this.clearRectangles();
    this.populateRectancles(this.placementIdsInput.value);
  }

  private clearRectangles(): void {
    console.log('clearRectangles');
    this.rectangles = [];
    this.videoContainer
      .querySelectorAll('.draggable')
      .forEach(el => el.remove());
    this.coordinatesContainer.innerHTML = '';
  }

  private populateRectancles(placementId: string): void {
    console.log('populateRectangles');
    const placementItems = this.placements[placementId];
    console.log(placementItems);
    const colors = this.generateDistinctColors(placementItems!.length);
    this.rectangles = placementItems.map((i, index) => {
      return {
        element: this.createRectangleElement(i, colors[index]),
        dataFieldName: i.dataField,
        x: i.x,
        y: i.y,
        width: i.width,
        height: i.height,
      };
    });
    this.rectangles.forEach(r => {
      this.videoContainer.appendChild(r.element);
      this.makeDraggable(r);
      this.createCoordinateDisplay(r);
    });
  }

  private createRectangleElement(
    i: PlacementItemVisualConfig,
    color: string
  ): HTMLDivElement {
    const rect = document.createElement('div');
    rect.id = i.dataField.replace(/\s+/g, '-').toLowerCase();
    rect.classList.add('draggable');
    rect.style.backgroundColor = color;
    rect.style.width = `${i.width}px`;
    rect.style.height = `${i.height}px`;
    //TODO position x & y
    rect.style.left = `${i.x}px`;
    rect.style.top = `${i.y}px`;
    rect.style.opacity = '0.5';
    rect.textContent = i.dataField;
    return rect;
  }

  private createCoordinateDisplay(r: Rectangle): void {
    const coordDiv = document.createElement('div');
    coordDiv.classList.add('coords');
    coordDiv.innerHTML = `${r.dataFieldName}:
      X: <span id="${r.element.id}-x">${r.x}</span>
      Y: <span id="${r.element.id}-y">${r.y}</span>
      Width: <span id="${r.element.id}-width">${r.width}</span>
      Height: <span id="${r.element.id}-height">${r.height}</span>`;
    this.coordinatesContainer.appendChild(coordDiv);
  }

  private makeDraggable(r: Rectangle): void {
    let isDragging = false;
    let startX = 0,
      startY = 0,
      initialX = 0,
      initialY = 0;
    const element = r.element;

    // Drag Logic
    element.addEventListener('mousedown', (e: MouseEvent) => {
      if (e.target !== element) return;

      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      initialX = element.offsetLeft;
      initialY = element.offsetTop;
      element.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e: MouseEvent) => {
      if (!isDragging) return;

      const offsetX = e.clientX - startX;
      const offsetY = e.clientY - startY;

      const scaleX = this.videoWidth / this.videoContainer.offsetWidth;
      const scaleY = this.videoHeight / this.videoContainer.offsetHeight;

      let newX = initialX + offsetX;
      let newY = initialY + offsetY;

      // const containerRect = this.videoContainer.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();

      const maxX = this.videoWidth - elementRect.width * scaleX;
      const maxY = this.videoHeight - elementRect.height * scaleY;

      newX = Math.max(0, Math.min(newX * scaleX, maxX));
      newY = Math.max(0, Math.min(newY * scaleY, maxY));

      element.style.left = `${newX / scaleX}px`;
      element.style.top = `${newY / scaleY}px`;

      const rectId = element.id;
      const rect = this.rectangles.find(r => r.element.id === rectId);

      if (rect) {
        rect.x = newX;
        rect.y = newY;

        document.getElementById(`${rectId}-x`)!.textContent =
          Math.round(newX).toString();
        document.getElementById(`${rectId}-y`)!.textContent =
          Math.round(newY).toString();
      }
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
      element.style.cursor = 'grab';
    });

    // Resize Logic
    element.addEventListener('mousemove', (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const resizeHandleSize = 10;

      if (
        e.clientX > rect.right - resizeHandleSize &&
        e.clientY > rect.bottom - resizeHandleSize
      ) {
        element.style.cursor = 'se-resize';
      } else if (isDragging) {
        element.style.cursor = 'grabbing';
      } else {
        element.style.cursor = 'grab';
      }
    });

    element.addEventListener('mousedown', (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const resizeHandleSize = 10;

      if (
        e.clientX > rect.right - resizeHandleSize &&
        e.clientY > rect.bottom - resizeHandleSize
      ) {
        e.preventDefault();
        isDragging = false;

        const startWidth = rect.width;
        const startHeight = rect.height;

        const resize = (e: MouseEvent) => {
          const scaleX = this.videoWidth / this.videoContainer.offsetWidth;
          const scaleY = this.videoHeight / this.videoContainer.offsetHeight;

          let newWidth = startWidth + (e.clientX - rect.left - startWidth);
          let newHeight = startHeight + (e.clientY - rect.top - startHeight);

          newWidth = Math.max(newWidth, 20);
          newHeight = Math.max(newHeight, 20);

          element.style.width = `${newWidth}px`;
          element.style.height = `${newHeight}px`;

          const rectId = element.id;

          const rectData = this.rectangles.find(r => r.element.id === rectId);
          if (rectData) {
            rectData.width = newWidth * scaleX;
            rectData.height = newHeight * scaleY;
          }

          document.getElementById(`${rectId}-width`)!.textContent = Math.round(
            rectData!.width
          ).toString();
          document.getElementById(`${rectId}-height`)!.textContent = Math.round(
            rectData!.height
          ).toString();
        };

        const stopResize = () => {
          document.removeEventListener('mousemove', resize);
          document.removeEventListener('mouseup', stopResize);
        };

        document.addEventListener('mousemove', resize);
        document.addEventListener('mouseup', stopResize);
      } else {
        isDragging = true;
      }
    });
  }

  private generateDistinctColors(numColors: number): string[] {
    const colors = [];
    for (let i = 0; i < numColors; i++) {
      const hue = (i / numColors) * 360;
      colors.push(`hsl(${hue}, 100%, 50%)`);
    }
    return colors;
  }
}
/**
 * Translation layer between AppsScript and popup's iFrame <script> namespaces
 */
export class PlacementItemVisualConfig {
  constructor(
    readonly x: number,
    readonly y: number,
    readonly width: number,
    readonly height: number,
    readonly dataField: string,
    readonly type: string
  ) {}
}

export const getPlacementVisualConfigs = () => {
  const sheets = new Sheets();
  const placementsConfig = sheets.getConfigTables([SheetName.placement])[
    SheetName.placement
  ];
  const placements: Record<string, PlacementItemVisualConfig[]> = {};
  placementsConfig?.forEach(i => {
    const placementId: string = i[ColumnName.placementId];
    let width: number = 100;
    let height: number = 100;
    if (i[ColumnName.elementType] === ElementType.text) {
      width = parseInt(i[ColumnName.textWidth]);
      height = parseInt(i[ColumnName.textSize]);
    } else if (i[ColumnName.elementType] === ElementType.image) {
      width = parseInt(i[ColumnName.imageWidth]);
      height = parseInt(i[ColumnName.imageHeight]);
    }
    const visConfig = new PlacementItemVisualConfig(
      parseInt(i[ColumnName.positionX]),
      parseInt(i[ColumnName.positionY]),
      width,
      height,
      i[ColumnName.dataField],
      i[ColumnName.elementType]
    );
    if (!placements[placementId]) {
      placements[placementId] = [visConfig];
    } else {
      placements[placementId].push(visConfig);
    }
  });
  console.log(placements);
  return placements;
};

export const showVideoPlacements = () => {
  const html = `
<style>
  #video-container {
    position: relative;
    width: 640px; /* Adjust as needed */
    height: 360px; /* Adjust as needed */
  }

  #myVideo {
    width: 100%;
    height: 100%;
  }

  .draggable {
    position: absolute;
    background-color: rgba(255, 0, 0, 0.5);
    border: 1px solid black;
    cursor: move;
    text-align: center;
    font-size: 12px;
    resize: both;
    overflow: hidden;
  }

  .coords {
    margin-top: 5px;
  }
</style>


<input type="file" id="videoFile" accept="video/*">
<select id="placementIds">
  <option value="1">
    1
  </option>
</select>
<input type="number" id="numFields" placeholder="Placement Id">
<button id="generateRectangles">Get</button>

<div id="video-container">
<video id="myVideo" controls></video>
</div>

<div id="coordinates-container"></div>

<script>
${VideoPlacements.toString()}
const placements = JSON.parse('${JSON.stringify(getPlacementVisualConfigs())}');
console.log(placements);
const videoPlacements = new VideoPlacements(placements);
videoPlacements.reloadPlacementVisuals();
</script>
  `;

  const htmlOutput = HtmlService.createHtmlOutput(html)
    .setWidth(800)
    .setHeight(600);

  SpreadsheetApp.getUi().showModelessDialog(
    htmlOutput,
    'Preview image and text placements'
  );
};
