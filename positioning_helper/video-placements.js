/**
 * @class VideoPlacements
 * @classdesc Manages video placements and interactive rectangles.
 */
class VideoPlacements {
  /**
   * @constructor
   * @description Initializes the VideoPlacements instance.
   */
  constructor() {
    this.rectangles = [];
    this.videoWidth = 0;
    this.videoHeight = 0;
    this.videoFile = document.getElementById('videoFile');
    this.myVideo = document.getElementById('myVideo');
    this.videoContainer = document.getElementById('video-container');
    this.coordinatesContainer = document.getElementById('coordinates-container');
    this.rectangleType = document.getElementById('rectangleType');
    this.rectangleName = document.getElementById('rectangleName');
    this.addRectangleButton = document.getElementById('addRectangle');
    this.addEventListeners();
  }

  /**
   * @method addEventListeners
   * @description Adds event listeners to the necessary elements.
   */
  addEventListeners() {
    this.videoFile.addEventListener('change', this.handleVideoFileChange.bind(this));
    this.myVideo.addEventListener('loadedmetadata', this.handleVideoMetadata.bind(this));
    this.addRectangleButton.addEventListener('click', this.handleAddRectangle.bind(this));
  }

  /**
   * @method handleVideoFileChange
   * @description Handles the change event for the video file input.
   * @param {Event} e - The change event.
   */
  handleVideoFileChange(e) {
    const file = e.target.files[0];

    // Validate file type
    if (!file || !file.type.startsWith('video/')) {
      console.error('Invalid file type. Please select a video file.');
      return;
    }

    // Validate file size (e.g., max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      console.error('File too large. Please select a smaller video file.');
      return;
    }

    try {
      const fileUrl = URL.createObjectURL(file);
      this.myVideo.setAttribute('src', fileUrl);
      this.myVideo.load();
    } catch (error) {
      console.error('Error loading video:', error);
      this.myVideo.setAttribute('src', '');
    }
  }

  /**
   * @method handleVideoMetadata
   * @description Handles the loadedmetadata event for the video element.
   */
  handleVideoMetadata() {
    this.videoWidth = this.myVideo.videoWidth;
    this.videoHeight = this.myVideo.videoHeight;
    // Set video container dimensions
    this.videoContainer.style.width = '100%';
    this.videoContainer.style.height = `${this.myVideo.offsetHeight}px`;
    console.log('Video Dimensions:', this.videoWidth, this.videoHeight);
  }

  /**
   * @method handleAddRectangle
   * @description Handles the click event for the add rectangle button.
   */
  handleAddRectangle() {
    const type = this.rectangleType.value;
    const name = this.rectangleName.value || `Unnamed ${type}`;
    this.createRectangle(type, name);
  }

  /**
   * @method createRectangle
   * @description Creates a new rectangle element and adds it to the video container.
   * @param {string} type - The type of the rectangle ('Image' or 'Text').
   * @param {string} name - The name of the rectangle.
   */
  createRectangle(type, name) {
    const color = type === 'Image' ? 'rgba(0, 255, 0, 0.5)' : 'rgba(255, 0, 0, 0.5)';
    const rectangle = this.createRectangleElement(name, color, type);

    // Set initial position
    rectangle.style.left = '0px';
    rectangle.style.top = '0px';

    const rectData = {
      element: rectangle,
      type,
      name,
      x: 0,
      y: 0,
      width: 80,
      height: 40,
    };

    this.rectangles.push(rectData);
    this.videoContainer.appendChild(rectangle);
    this.makeDraggable(rectangle);
    this.createCoordinateDisplay(rectangle, name, type);
  }

  /**
   * @method createRectangleElement
   * @description Creates a new rectangle DOM element.
   * @param {string} name - The name of the rectangle.
   * @param {string} color - The background color of the rectangle.
   * @param {string} type - The type of the rectangle ('Image' or 'Text').
   * @returns {HTMLElement} The created rectangle element.
   */
  createRectangleElement(name, color, type) {
    const rect = document.createElement('div');
    rect.id = `${name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`; // Unique ID
    rect.classList.add('draggable');
    rect.classList.add(type.toLowerCase());
    rect.style.backgroundColor = color;
    rect.style.width = "80px";
    rect.style.height = "40px";

    const label = document.createElement('div');
    label.style.position = 'absolute';
    label.style.top = '-20px';
    label.style.width = '100%';
    label.style.textAlign = 'center';
    label.style.color = 'black';
    label.textContent = name;
    rect.appendChild(label);

    return rect;
  }

  /**
   * @method createCoordinateDisplay
   * @description Creates the coordinate display for a rectangle.
   * @param {HTMLElement} element - The rectangle element.
   * @param {string} name - The name of the rectangle.
   * @param {string} type - The type of the rectangle ('Image' or 'Text').
   */
  createCoordinateDisplay(element, name, type) {
    const coordDiv = document.createElement('div');
    coordDiv.classList.add('coords');

    // Create title text with bold styling
    const titleSpan = document.createElement('span');
    titleSpan.className = 'coords-title';
    titleSpan.textContent = `${name} (${type})`;
    coordDiv.appendChild(titleSpan);

    // Create delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.title = 'Delete rectangle';
    const deleteIcon = document.createElement('span');
    deleteIcon.className = 'material-icons';
    deleteIcon.textContent = 'delete';
    deleteBtn.appendChild(deleteIcon);
    coordDiv.appendChild(deleteBtn);

    // Create coordinates display
    const coordsContent = document.createElement('div');
    coordsContent.className = 'coords-content';

    // X coordinate
    coordsContent.appendChild(document.createTextNode('X: '));
    const xSpan = document.createElement('span');
    xSpan.id = `${element.id}-x`;
    xSpan.textContent = '0';
    coordsContent.appendChild(xSpan);
    coordsContent.appendChild(document.createElement('br'));

    // Y coordinate
    coordsContent.appendChild(document.createTextNode('Y: '));
    const ySpan = document.createElement('span');
    ySpan.id = `${element.id}-y`;
    ySpan.textContent = '0';
    coordsContent.appendChild(ySpan);
    coordsContent.appendChild(document.createElement('br'));

    // Width
    coordsContent.appendChild(document.createTextNode('Width: '));
    const widthSpan = document.createElement('span');
    widthSpan.id = `${element.id}-width`;
    widthSpan.textContent = '80';
    coordsContent.appendChild(widthSpan);
    coordsContent.appendChild(document.createElement('br'));

    // Height
    coordsContent.appendChild(document.createTextNode('Height: '));
    const heightSpan = document.createElement('span');
    heightSpan.id = `${element.id}-height`;
    heightSpan.textContent = '40';
    coordsContent.appendChild(heightSpan);

    coordDiv.appendChild(coordsContent);

    deleteBtn.addEventListener('click', () => this.deleteRectangle(element.id));
    this.coordinatesContainer.appendChild(coordDiv);
  }

  /**
   * @method deleteRectangle
   * @description Deletes a rectangle and its coordinate display.
   * @param {string} id - The ID of the rectangle to delete.
   */
  deleteRectangle(id) {
    const index = this.rectangles.findIndex((r) => r.element.id === id);
    if (index !== -1) {
      // Remove the element from DOM
      this.rectangles[index].element.remove();
      // Remove the coordinates display
      const coordsDisplay = this.coordinatesContainer.children[index];
      coordsDisplay.remove();
      // Remove from rectangles array
      this.rectangles.splice(index, 1);
    }
  }

  /**
   * @method makeDraggable
   * @description Makes a rectangle draggable and resizable.
   * @param {HTMLElement} element - The rectangle element.
   */
  makeDraggable(element) {
    let isDragging = false;
    let isResizing = false;
    let currentX = 0, currentY = 0, initialX = 0, initialY = 0;

    const updateCoordinates = () => {
      const containerRect = this.videoContainer.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      const scaleX = this.videoWidth / containerRect.width;
      const scaleY = this.videoHeight / containerRect.height;

      const rectId = element.id;
      const rect = this.rectangles.find((r) => r.element.id === rectId);

      if (rect) {
        // Calculate relative position to video container
        const relativeX = elementRect.left - containerRect.left;
        const relativeY = elementRect.top - containerRect.top;

        if (rect.type === 'Image') {
          // For images, calculate center point
          rect.x = Math.round((relativeX + elementRect.width/2) * scaleX);
          rect.y = Math.round((relativeY + elementRect.height/2) * scaleY);
        } else {
          // For text, keep top-left position
          rect.x = Math.round(relativeX * scaleX);
          rect.y = Math.round(relativeY * scaleY);
        }

        rect.width = Math.round(elementRect.width * scaleX);
        rect.height = Math.round(elementRect.height * scaleY);

        // Update display
        document.getElementById(`${rectId}-x`).textContent = rect.x.toString();
        document.getElementById(`${rectId}-y`).textContent = rect.y.toString();
        document.getElementById(`${rectId}-width`).textContent = rect.width.toString();
        document.getElementById(`${rectId}-height`).textContent = rect.height.toString();
      }
    };

    element.addEventListener('mousedown', (e) => {
      if (e.target !== element) return;

      const rect = element.getBoundingClientRect();
      const resizeHandleSize = 10;

      if (e.clientX > rect.right - resizeHandleSize &&
          e.clientY > rect.bottom - resizeHandleSize) {
        isResizing = true;
      } else {
        isDragging = true;
        initialX = e.clientX - element.offsetLeft;
        initialY = e.clientY - element.offsetTop;
        element.style.cursor = 'grabbing';
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;

        const containerRect = this.videoContainer.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();

        currentX = Math.max(0, Math.min(currentX, containerRect.width - elementRect.width));
        currentY = Math.max(0, Math.min(currentY, containerRect.height - elementRect.height));

        element.style.left = `${currentX}px`;
        element.style.top = `${currentY}px`;

        updateCoordinates();
      }

      if (isResizing) {
        e.preventDefault();
        const rect = element.getBoundingClientRect();
        const newWidth = Math.max(20, e.clientX - rect.left);
        const newHeight = Math.max(20, e.clientY - rect.top);

        element.style.width = `${newWidth}px`;
        element.style.height = `${newHeight}px`;

        updateCoordinates();
      }
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
      isResizing = false;
      element.style.cursor = 'grab';
      updateCoordinates(); // Final update
    });

    // Update cursor on mousemove
    element.addEventListener('mousemove', (e) => {
      const rect = element.getBoundingClientRect();
      const resizeHandleSize = 10;
      if (e.clientX > rect.right - resizeHandleSize &&
          e.clientY > rect.bottom - resizeHandleSize) {
        element.style.cursor = 'se-resize';
      } else {
        element.style.cursor = 'grab';
      }
    });
  }
}

const videoPlacements = new VideoPlacements();
