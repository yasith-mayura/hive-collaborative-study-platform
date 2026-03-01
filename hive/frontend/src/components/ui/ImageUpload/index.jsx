import React, { useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";

import Modal from "@/components/ui/Modal";
import Notification from "@/components/ui/Notification";

import {
  img,
  thumb,
  thumbInner,
  thumbsContainer,
  rejectStyle,
  acceptStyle,
  focusedStyle,
  baseStyle,
} from "./style";

const ImageUpload = ({
  openState,
  parentCallback,
  imgHeight,
  imgWidth,
  imgType,
  imgUrl,
  imgSize,
  helpMessage,
}) => {
  const [selectedImage, setSelectedImage] = useState();
  const [open, setOpen] = useState(openState);
  const [file, setFile] = useState(null);
  const [files, setFiles] = useState([]);
  const [isImage, setIsImgage] = useState(imgUrl ? true : false);

  const fileTypes = ["JPG", "PNG", "JPGE"];

  const handleChange = (file) => {
    setSelectedImage(file);
    setFile(file);
  };

  // This function will be triggered when the file field change
  const imageChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedImage(e.target.files[0]);
    }
  };

  // This function will be triggered when the "Remove This Image" button is clicked
  const removeSelectedImage = () => {
    setSelectedImage();
  };

  const handleOnSubmit = (acceptedFiles) => {
    return { acceptedFiles: acceptedFiles, open: true };
  };

  const handleOnClose = () => {
    //setOpen(false);
    return { acceptedFiles: null, open: false };
  };

  // Image upload from DropZone
  // Accepted image types are jpg, jpeg and png
  // Max size is 3MB
  const { getRootProps, getInputProps, isFocused, isDragAccept, isDragReject } =
    useDropzone({
      accept: imgType
        ? imgType
        : {
            "image/jpg": [],
            "image/jpeg": [],
            "image/png": [],
          },
      multiple: false,
      maxSize: imgSize ? imgSize : 3000000,
      onDrop: (acceptedFiles, rejectedFiles) => {
        acceptedFiles.map((file) => {
          const img = new Image();
          img.src = URL.createObjectURL(file);
          img.onload = () => {
            if (imgHeight && img.height !== imgHeight) {
              Notification.error("Image height is not matched!");
            } else if (imgWidth > 0 && img.width !== imgWidth) {
              Notification.error("Image width is not matched!");
            } else {
              setIsImgage(false);
              setFiles(
                acceptedFiles.map((file) =>
                  Object.assign(file, {
                    preview: URL.createObjectURL(file),
                  })
                )
              );
              parentCallback(handleOnSubmit(acceptedFiles));
            }
          };
        });
        if (rejectedFiles.length > 0) {
          if (rejectedFiles[0].errors[0].code == "file-invalid-type") {
            Notification.error("File type must be jpg, jpeg or png");
          } else if (rejectedFiles.length > 1) {
            Notification.error("Only one file can be uploaded!");
          } else {
            Notification.error(
              imgSize
                ? `Image size is larger than ${imgSize / 1000}KB.`
                : "Image size is larger than 3MB."
            );
          }
        }
      },
    });

  const style = useMemo(
    () => ({
      ...baseStyle,
      ...(isFocused ? focusedStyle : {}),
      ...(isDragAccept ? acceptStyle : {}),
      ...(isDragReject ? rejectStyle : {}),
    }),
    [isFocused, isDragAccept, isDragReject]
  );

  const thumbs = files.map((file) => (
    <div style={thumb} key={file.name}>
      <div style={thumbInner}>
        <img
          alt="Image"
          src={file.preview}
          style={img}
          onLoad={() => {
            URL.revokeObjectURL(file.preview);
          }}
        />
      </div>
    </div>
  ));

  const imgThumb = (
    <div style={thumb}>
      <div style={thumbInner}>
        <img
          alt="Image"
          src={imgUrl}
          style={img}
          onLoad={() => {
            URL.revokeObjectURL(imgUrl);
          }}
        />
      </div>
    </div>
  );

  return (
    <>
      <Modal
        activeModal={open}
        onClose={() => parentCallback(handleOnClose())}
        title={"Image Upload"}
        themeClass="bg-white"
      >
        <div>
          <div className="text-center mt-5">
            <section className="container">
              <div {...getRootProps({ style })}>
                <input {...getInputProps()} />
                <p className="block text-slate-600 dark:text-slate-300 text-sm font-normal">
                  Drag and drop an image here or click to select an image.
                </p>
                {helpMessage && helpMessage != "" ? (
                  <span className="block text-slate-500 dark:text-slate-300 text-xs font-normal">
                    {helpMessage}
                  </span>
                ) : (
                  <></>
                )}
              </div>
              <aside style={thumbsContainer}>
                {isImage ? imgThumb : thumbs}
              </aside>
            </section>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ImageUpload;
