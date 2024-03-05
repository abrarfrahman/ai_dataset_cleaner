"use client"
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import OpenAI from "openai";

export default function Home() {
  const [jsonData, setJsonData] = useState(null);
  const [editIndex, setEditIndex] = useState(null);
  const [hoverIndex, setHoverIndex] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [summaryData, setSummaryData] = useState([]);
  const openai = new OpenAI({ apiKey: "NOPE", dangerouslyAllowBrowser: true  });

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      try {
        const data = JSON.parse(content);
        setJsonData(data);
      } catch (error) {
        console.error('Error parsing JSON:', error);
        setJsonData(null);
        alert('Error parsing JSON file. Please upload a valid JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const handleRoleChange = (index, role) => {
    setJsonData(prevData => {
      const newData = [...prevData];
      newData[index].role = role;
      return newData;
    });
  };

  const handleContentEdit = (index, newValue) => {
    setJsonData(prevData => {
      const newData = [...prevData];
      newData[index].content = newValue;
      return newData;
    });
  };

  const handleDragStart = (event, index) => {
    event.dataTransfer.setData('index', index);
  };

  const handleDragOver = (event, index) => {
    event.preventDefault();
    setHoverIndex(index);
  };

  const handleDeleteRow = (index) => {
    setJsonData((prevData) => {
      const newData = [...prevData];
      newData.splice(index, 1);
      return newData;
    });
  };

  const handleDrop = (event, targetIndex) => {
    const startIndex = parseInt(event.dataTransfer.getData('index'));
    const itemToMove = jsonData[startIndex];
    const updatedData = jsonData.filter((item, index) => index !== startIndex);
    updatedData.splice(targetIndex, 0, itemToMove);
    setJsonData(updatedData);
    setHoverIndex(null); // Reset hover index after drop
  };

  const addNewRow = (index) => {
    const newRow = { role: 'assistant', content: '' };
    setJsonData(prevData => {
      const newData = [...prevData];
      newData.splice(index, 0, newRow);
      return newData;
    });
  };

  const deleteRow = (index) => {
    const newData = [...jsonData];
    newData.splice(index, 1);
    setJsonData(newData);
  };

  const handleModalSubmit = async () => {
    setLoading(true);
    try {
      const updatedSummaryData = [];
  
      // Iterate through each row
      for (let i = 0; i < jsonData.length; i++) {
        const item = jsonData[i];
        const role = item.role;
        const content = item.content;
    
        // Prepare prompt for the OpenAI API
        console.log(`Submitting request for row ${i + 1}: Content - ${content}`);
        const userPrompt = prompt.trim();
        const sysPrompt = `Here is the human request for this specific conversation: ${userPrompt}. Role - ${role}. Regarding logistics, numbers, addresses, and clerical errors, please provide any necessary updates to the following: Role - ${role}, Content - ${content}. Make the smallest changes possible. Respond only with the amended text, with no explaination before or after. If the rest of the request is not relevant to the human request, respond only with "HECK NO BROTHER".`;
  
        // Call OpenAI API
        const completion = await openai.chat.completions.create({
          messages: [{ role: 'system', content: sysPrompt }],
          model: 'gpt-3.5-turbo',
        });
  
        console.log(`Received response for row ${i + 1}:`, completion);
  
        // Check if a change is needed
        if (completion.choices[0].finish_reason === 'stop') {
          const amendedText = completion.choices[0].message.content.trim();
  
          // Only make changes if necessary
          if (!amendedText.toUpperCase().includes('HECK NO BROTHER')) {
            updatedSummaryData.push({ role, content, amendedText });
          }
        }
      }
  
      // Update the summary if changes were made
      if (updatedSummaryData.length > 0) {
        setSummaryData(updatedSummaryData);
      }
  
      setLoading(false);
      setModalOpen(false);
    } catch (error) {
      console.error('Error processing table rows:', error);
      setLoading(false);
      setModalOpen(false);
      alert('Error processing table rows. Please try again later.');
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-12 bg-gray-200">
      <div className="w-full max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4 text-black">AI-powered Dataset Cleaner</h1>
          <p className="text-lg text-black">
            In this challenge, the goal is to create an AI-powered editor similar to Cursor's edit functionality that lets you modify a transcript with natural language.
          </p>
          <p className="text-lg mt-4 text-black">
            Our goal is to implement features such as rendering from JSON, editing inline, a magic wand tool, row selection, and more, all while maintaining a clean and customizable UI.
          </p>
        </div>

        <div className="grid w-full max-w-sm items-center gap-1.5 mb-8">
          <Label htmlFor="jsonFile" className="text-black">Upload JSON File:</Label>
          <Input id="jsonFile" type="file" accept=".json" onChange={handleFileChange} />
        </div>

        {jsonData && (
          <div className="w-full">
            <div className="grid gap-2">
              {jsonData.map((item, index) => (
                <div
                  key={index}
                  className={`p-2 rounded flex items-start relative ${hoverIndex === index ? 'bg-gray-300' : ''}`}
                  onMouseEnter={() => setHoverIndex(index)}
                  onMouseLeave={() => setHoverIndex(null)}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  draggable
                >
                  <div className={`border-2 rounded p-1 relative w-[100px] ${item.role === 'user' ? 'bg-green-100 border-green-900' : item.role === 'tool' ? 'bg-red-100 border-red-900' : 'bg-blue-100 border-blue-900'}`}>
                    <p
                      className={`font-bold text-right cursor-pointer ${item.role === 'user' ? 'text-green-900' : item.role === 'tool' ? 'text-red-900' : 'text-blue-900'}`}
                      onClick={() => setEditIndex(index)}
                    >
                      {item.role}
                    </p>
                    {editIndex === index && (
                      <div className="absolute top-0 left-full mt-1 z-20">
                        <select
                          className="border rounded p-1"
                          value={item.role}
                          onChange={(e) => { handleRoleChange(index, e.target.value); setEditIndex(null); }}
                        >
                          <option value="assistant">Assistant</option>
                          <option value="user">User</option>
                          <option value="tool">Tool</option>
                        </select>
                      </div>
                    )}
                  </div>
                  <p
                    contentEditable="true"
                    suppressContentEditableWarning={true}
                    className="ml-2 text-black min-w-[200px]"
                    onBlur={(e) => handleContentEdit(index, e.target.innerText)}
                  >
                    {item.content}
                  </p>
                  {hoverIndex === index && (
                    <div className="flex space-x-2 absolute right-0 bottom-0">
                      <button
                        className="px-2 py-1 bg-gray-500 text-white rounded"
                        onClick={() => addNewRow(index + 1)}
                      >
                        Add Row
                      </button>
                      <button
                        className="px-2 py-1 bg-red-500 text-white rounded"
                        onClick={() => deleteRow(index)}
                      >
                        Delete Row
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {!jsonData && (
          <div className="w-full h-[400px] bg-gray-200 dark:bg-zinc-800/30 rounded-lg flex items-center justify-center">
            <p className="text-black">No data available. Please upload a JSON file.</p>
          </div>
        )}
      </div>

      {/* Summary Table */}
      {summaryData.length > 0 && (
        <div className="w-full max-w-5xl mt-8">
          <h2 className="text-2xl font-bold mb-4 text-black">Summary of Changes</h2>
          <table className="w-full border-collapse border border-gray-800">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-800 px-4 py-2">Role</th>
                <th className="border border-gray-800 px-4 py-2">Original Content</th>
                <th className="border border-gray-800 px-4 py-2">Amended Content</th>
              </tr>
            </thead>
            <tbody>
              {summaryData.map((row, index) => (
                <tr key={index} className="bg-white">
                  <td className="border border-gray-800 px-4 py-2">{row.role}</td>
                  <td className="border border-gray-800 px-4 py-2">
                    <span className="text-red-500 line-through">{row.content}</span>
                  </td>
                  <td className="border border-gray-800 px-4 py-2">
                    <span className="text-green-500">{row.amendedText}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for providing prompt */}
      {modalOpen && (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-gray-900 bg-opacity-75 z-50">
          <div className="bg-white p-4 rounded shadow-md w-96">
            <h2 className="text-lg font-semibold mb-4">Provide Prompt for OpenAI</h2>
            <p className="mb-4 text-sm text-gray-600">Please provide any desired updates to the logistics call.</p>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full mb-4 h-32 p-2 resize-none"
              placeholder="Enter prompt here..."
            />
            <button
              className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
              onClick={handleModalSubmit}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Submit'}
            </button>
          </div>
        </div>
      )}
      
      {/* Magic Wand Button */}
      {jsonData && (
        <button
          className="fixed top-12 right-12 bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 z-50"
          onClick={() => setModalOpen(true)}
        >
          Magic Wand
        </button>
      )}
    </main>
  );
}
