import React, { useState, useEffect, useMemo } from 'react';
import { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import './FileUpload.css';

const FileUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [fileContent, setFileContent] = useState('');

  const s3Client = useMemo(() => new S3Client({
    region: 'us-east-1',
    credentials: {
      accessKeyId: 'AKIARXGBZYVTL7VLQAVG',
      secretAccessKey: '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'
    }
  }), []);

  useEffect(() => {
    const fetchFiles = async () => {
      setLoadingFiles(true);
      try {
        const command = new ListObjectsV2Command({
          Bucket: 'texttrat-iitp-project',
          Prefix: 'output/'
        });
        const response = await s3Client.send(command);
        const newFiles = response.Contents ? response.Contents.map(item => item.Key) : [];
        setFiles(prevFiles => [...prevFiles, ...newFiles.filter(file => !prevFiles.includes(file))]);
      } catch (err) {
        console.error('Error fetching files:', err);
      } finally {
        setLoadingFiles(false);
      }
    };

    fetchFiles();

    const intervalId = setInterval(fetchFiles, 5000);

    return () => clearInterval(intervalId);
  }, [s3Client]);

  const handleFileClick = async (fileKey) => {
    try {
      const command = new GetObjectCommand({
        Bucket: 'texttrat-iitp-project',
        Key: fileKey
      });
      const response = await s3Client.send(command);
      const content = await new Response(response.Body).text();
      setFileContent(content);
    } catch (err) {
      console.error('Error fetching file content:', err);
      setFileContent('Error fetching file content');
    }
  };

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage('Please select a file to upload.');
      return;
    }

    setUploading(true);
    setMessage('');

    const params = {
      Bucket: 'texttrat-iitp-project',
      Key: selectedFile.name,
      Body: selectedFile
    };

    try {
      const command = new PutObjectCommand(params);
      await s3Client.send(command);
      setMessage('File uploaded successfully!');
    } catch (err) {
      setMessage(`File upload failed: ${err.message}`);
      console.error('Error uploading file:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="file-upload-container">
      <div className="file-upload">
        <h2>IIT Patna - Adverse Event Detector</h2>
        <input type="file" onChange={handleFileChange} />
        <button onClick={handleUpload} disabled={uploading}>
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
        {message && <p className="message">{message}</p>}
        <h3>Files in S3 (output/ folder):</h3>
        {loadingFiles ? (
          <p>Loading files...</p>
        ) : (
          <ul className="file-list">
            {files.map((file, index) => (
              <li key={index} onClick={() => handleFileClick(file)}>{file}</li>
            ))}
          </ul>
        )}
      </div>
      <div className="file-content">
        <h3>File Content:</h3>
        <pre>{fileContent}</pre>
      </div>
    </div>
  );
};

export default FileUpload;
