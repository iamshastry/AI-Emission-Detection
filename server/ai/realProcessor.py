from ultralytics import YOLO
import sys
import cv2
import os

# Load models
smoke_model_path = os.path.join(os.path.dirname(__file__), "best.pt")
smoke_model = YOLO(smoke_model_path)
vehicle_model = YOLO("yolov8n.pt")  # Make sure it's present

def classify_intensity(smoke_area_ratio):
    if smoke_area_ratio < 0.01:
        return "low"
    elif smoke_area_ratio < 0.05:
        return "moderate"
    else:
        return "high"

def run_detection(img_path):
    img = cv2.imread(img_path)
    if img is None:
        print("Error: Failed to read image", file=sys.stderr)
        return None

    image_area = img.shape[0] * img.shape[1]
    total_smoke_area = 0

    # Smoke Detection
    smoke_results = smoke_model(img_path)
    for result in smoke_results:
        for box in result.boxes:
            cls = int(box.cls[0])
            label = smoke_model.names[cls].lower()
            conf = float(box.conf[0])
            x1, y1, x2, y2 = map(int, box.xyxy[0])

            if label == "smoke":
                box_area = (x2 - x1) * (y2 - y1)
                total_smoke_area += box_area

                # Draw smoke box
                cv2.rectangle(img, (x1, y1), (x2, y2), (128, 128, 255), 2)
                cv2.putText(img, f"{label} {conf:.2f}", (x1, y1 - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 0, 0), 2)

    # Vehicle Detection
    vehicle_results = vehicle_model(img_path)
    for result in vehicle_results:
        for box in result.boxes:
            cls = int(box.cls[0])
            label = vehicle_model.names[cls].lower()
            conf = float(box.conf[0])
            x1, y1, x2, y2 = map(int, box.xyxy[0])

            if label in ["car", "bus", "truck", "motorbike"]:
                color = (0, 255, 0)
                cv2.rectangle(img, (x1, y1), (x2, y2), color, 2)
                cv2.putText(img, f"{label} {conf:.2f}", (x1, y2 + 20),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

    smoke_percent = 0.0
    intensity = "none"
    if total_smoke_area > 0 and image_area > 0:
        smoke_ratio = total_smoke_area / image_area
        smoke_percent = smoke_ratio * 100
        intensity = classify_intensity(smoke_ratio)

    # Save annotated image
    cv2.putText(img, f"Smoke Intensity: {intensity}", (20, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 3)
    cv2.imwrite("uploads/processed-input.jpg", img)

    # Print debug to stderr
    print(f"Smoke intensity: {intensity}", file=sys.stderr)

    # ✅ Print only smoke percentage to stdout (for Node backend)
    print(f"{smoke_percent:.2f}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python realProcessor.py <image_path>", file=sys.stderr)
        sys.exit(1)

    run_detection(sys.argv[1])
