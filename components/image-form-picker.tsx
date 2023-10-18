import { useEffect, useState } from "react";
import { FcInfo } from "react-icons/fc";

type ImageFormPickerProps = {
  label: string
  profilePicture: File | null
  setProfilePicture: (val: File | null) => void
  profilePictureError: string
  setProfilePictureError: (val: string) => void
}

const ImageFormPicker = (props: ImageFormPickerProps) => {
  useEffect(() => {
    const allowedExtensions = ["image/png", "image/jpg", "image/jpeg"];
    if (
      props.profilePicture !== null &&
      !allowedExtensions.includes(props.profilePicture.type)
    ) {
      props.setProfilePictureError("Not allowed extension");
    } else props.setProfilePictureError("");
  }, [props]);

  return (
    <div className="form-control">
      <label className="label">
        <div className="flex gap-1 items-center">
          <span className="label-text">{props.label}</span>
          <div
            className="tooltip"
            data-tip="only allowed .jpeg .jpg .png"
          >
            <FcInfo />
          </div>
        </div>
      </label>
      <input
        type="file"
        className="file-input file-input-bordered"
        onChange={(e) => {
          if (e.currentTarget.files === null) props.setProfilePicture(null);
          else props.setProfilePicture(e.currentTarget.files[0]);
        }}
      />
      <label className="label">
        <span className="label-text-alt text-error min-h-1">
          {props.profilePictureError}
        </span>
      </label>
    </div>
  )
}

export default ImageFormPicker