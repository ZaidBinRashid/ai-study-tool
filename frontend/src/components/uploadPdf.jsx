import {  useCallback} from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";


async function uploadPdfToServer(file) {
    const formData = new FormData();
    formData.append("pdf", file);

    try {
        const response = await axios.post("http://localhost:5000/upload", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
            withCredentials: true,
        });
        return response.data;
    } catch (error) {
        console.error("Error uploading PDF:", error);
        alert("Error uploading PDF: " + error.message);
    }
}


export default function UploadPdf() {
  const onDrop = useCallback((acceptedFiles) => {
    // Handle the uploaded PDF file(s)
    const pdfFiles = acceptedFiles.filter(
      (file) => file.type === "application/pdf"
    );
    if (pdfFiles.length > 0) {
      // Do something with the PDF file(s)
      uploadPdfToServer(pdfFiles[0])
        .then((data) => {
          console.log("Uploaded PDF:", pdfFiles[0]);
          console.log("Server response:", data);
        })
        .catch((error) => {
          alert(console.error("Error uploading PDF:", error));
        });
    } else {
      alert("Please upload a PDF file.");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [] },
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      style={{
        border: "2px dashed #888",
        padding: "2rem",
        textAlign: "center",
        cursor: "pointer",
      }}
    >
      <input {...getInputProps()} />
      {isDragActive ? (
        <p>Drop the PDF here ...</p>
      ) : (
        <p>Drag 'n' drop a PDF file here, or click to select one</p>
      )}
    </div>
  );
}


