import { useEffect } from "react"

type NameFormInputProps = {
  label: string
  required: boolean
  name: string
  setName: (val: string) => void
  nameError: string
  setNameError: (val: string) => void
}

const NameFormInput = (props: NameFormInputProps) => {
  useEffect(() => {
    if (props.required && props.name.length === 0) props.setNameError("Required");
    else props.setNameError("");
  }, [props]);

  return (
    <div className="form-control">
      <label className="label">
        <span className="label-text">{props.label}</span>
      </label>
      <input
        type="text"
        placeholder="Type here"
        className="input input-bordered"
        value={props.name}
        onChange={(e) => {
          props.setName(e.currentTarget.value);
        }}
      />
      <label className="label">
        <span className="label-text-alt text-error min-h-1">
          {props.nameError}
        </span>
      </label>
    </div>
  )
}

export default NameFormInput