var VideoPlacements = /** @class */ (function () {
  function VideoPlacements() {
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
  VideoPlacements.prototype.addEventListeners = function () {
      this.videoFile.addEventListener('change', this.handleVideoFileChange.bind(this));
      this.myVideo.addEventListener('loadedmetadata', this.handleVideoMetadata.bind(this));
      this.addRectangleButton.addEventListener('click', this.handleAddRectangle.bind(this));
  };
  VideoPlacements.prototype.handleVideoFileChange = function (e) {
      var file = e.target.files[0];
      var fileUrl = URL.createObjectURL(file);
      this.myVideo.src = fileUrl;
      this.myVideo.load();
  };
  VideoPlacements.prototype.handleVideoMetadata = function () {
      this.videoWidth = this.myVideo.videoWidth;
      this.videoHeight = this.myVideo.videoHeight;
      // Set video container dimensions
      this.videoContainer.style.width = '100%';
      this.videoContainer.style.height = this.myVideo.offsetHeight + 'px';
      console.log('Video Dimensions:', this.videoWidth, this.videoHeight);
  };
  VideoPlacements.prototype.handleAddRectangle = function () {
      var type = this.rectangleType.value;
      var name = this.rectangleName.value || 'Unnamed ' + type;
      this.createRectangle(type, name);
  };
  VideoPlacements.prototype.createRectangle = function (type, name) {
      var color = type === 'Image' ? 'rgba(0, 255, 0, 0.5)' : 'rgba(255, 0, 0, 0.5)';
      var rectangle = this.createRectangleElement(name, color, type);

      // Set initial position
      rectangle.style.left = '0px';
      rectangle.style.top = '0px';

      var rectData = {
          element: rectangle,
          type: type,
          name: name,
          x: 0,
          y: 0,
          width: 80,
          height: 40,
      };

      this.rectangles.push(rectData);
      this.videoContainer.appendChild(rectangle);
      this.makeDraggable(rectangle);
      this.createCoordinateDisplay(rectangle, name, type);
  };
  VideoPlacements.prototype.createRectangleElement = function (name, color, type) {
      var rect = document.createElement('div');
      rect.id = name.replace(/\s+/g, '-').toLowerCase();
      rect.classList.add('draggable');
      rect.classList.add(type.toLowerCase());
      rect.style.backgroundColor = color;
      rect.style.width = "80px";
      rect.style.height = "40px";

      var label = document.createElement('div');
      label.style.position = 'absolute';
      label.style.top = '-20px';
      label.style.width = '100%';
      label.style.textAlign = 'center';
      label.style.color = 'black';
      label.textContent = name;
      rect.appendChild(label);

      return rect;
  };
  VideoPlacements.prototype.createCoordinateDisplay = function (element, name, type) {
      var coordDiv = document.createElement('div');
      coordDiv.classList.add('coords');
      coordDiv.innerHTML = `${name} (${type}):
          <button class="delete-btn" title="Delete rectangle">
              <span class="material-icons">delete</span>
          </button>
          X: <span id="${element.id}-x">0</span>
          Y: <span id="${element.id}-y">0</span>
          Width: <span id="${element.id}-width">80</span>
          Height: <span id="${element.id}-height">40</span>`;

      var deleteBtn = coordDiv.querySelector('.delete-btn');
      deleteBtn.addEventListener('click', () => this.deleteRectangle(element.id));

      this.coordinatesContainer.appendChild(coordDiv);
  };

  VideoPlacements.prototype.deleteRectangle = function (id) {
      var index = this.rectangles.findIndex(function (r) { return r.element.id === id; });
      if (index !== -1) {
          // Remove the element from DOM
          this.rectangles[index].element.remove();
          // Remove the coordinates display
          var coordsDisplay = this.coordinatesContainer.children[index];
          coordsDisplay.remove();
          // Remove from rectangles array
          this.rectangles.splice(index, 1);
      }
  };

  VideoPlacements.prototype.makeDraggable = function (element) {
      var _this = this;
      var isDragging = false;
      var isResizing = false;
      var currentX = 0, currentY = 0, initialX = 0, initialY = 0;

      function updateCoordinates() {
          var containerRect = _this.videoContainer.getBoundingClientRect();
          var elementRect = element.getBoundingClientRect();
          var scaleX = _this.videoWidth / containerRect.width;
          var scaleY = _this.videoHeight / containerRect.height;

          var rectId = element.id;
          var rect = _this.rectangles.find(function (r) { return r.element.id === rectId; });

          if (rect) {
              // Calculate relative position to video container
              var relativeX = elementRect.left - containerRect.left;
              var relativeY = elementRect.top - containerRect.top;

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
              document.getElementById(rectId + "-x").textContent = rect.x.toString();
              document.getElementById(rectId + "-y").textContent = rect.y.toString();
              document.getElementById(rectId + "-width").textContent = rect.width.toString();
              document.getElementById(rectId + "-height").textContent = rect.height.toString();
          }
      }

      element.addEventListener('mousedown', function (e) {
          if (e.target !== element) return;

          var rect = element.getBoundingClientRect();
          var resizeHandleSize = 10;

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

      document.addEventListener('mousemove', function (e) {
          if (isDragging) {
              e.preventDefault();
              currentX = e.clientX - initialX;
              currentY = e.clientY - initialY;

              var containerRect = _this.videoContainer.getBoundingClientRect();
              var elementRect = element.getBoundingClientRect();

              currentX = Math.max(0, Math.min(currentX, containerRect.width - elementRect.width));
              currentY = Math.max(0, Math.min(currentY, containerRect.height - elementRect.height));

              element.style.left = currentX + 'px';
              element.style.top = currentY + 'px';

              updateCoordinates();
          }

          if (isResizing) {
              e.preventDefault();
              var rect = element.getBoundingClientRect();
              var newWidth = Math.max(20, e.clientX - rect.left);
              var newHeight = Math.max(20, e.clientY - rect.top);

              element.style.width = newWidth + 'px';
              element.style.height = newHeight + 'px';

              updateCoordinates();
          }
      });

      document.addEventListener('mouseup', function () {
          isDragging = false;
          isResizing = false;
          element.style.cursor = 'grab';
          updateCoordinates(); // Final update
      });

      // Update cursor on mousemove
      element.addEventListener('mousemove', function (e) {
          var rect = element.getBoundingClientRect();
          var resizeHandleSize = 10;
          if (e.clientX > rect.right - resizeHandleSize &&
              e.clientY > rect.bottom - resizeHandleSize) {
              element.style.cursor = 'se-resize';
          } else {
              element.style.cursor = 'grab';
          }
      });
  };
  VideoPlacements.prototype.generateDistinctColors = function (numColors) {
      var colors = [];
      for (var i = 0; i < numColors; i++) {
          var hue = (i / numColors) * 360;
          colors.push("hsl(".concat(hue, ", 100%, 50%)"));
      }
      return colors;
  };
  return VideoPlacements;
}());
var videoPlacements = new VideoPlacements();
