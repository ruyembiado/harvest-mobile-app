const translateText = async (text: string, targetLang: string): Promise<string | null> => {
    const apiKey = "AIzaSyBOCU75s8epi2_S7EMtAeYYoYDCLlT42sI";
    const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
  
    const body = JSON.stringify({
      q: text,
      target: targetLang,
      format: "text",
    });
  
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body,
      });
  
      const data = await response.json();
      return data.data.translations[0]?.translatedText || "Translation Error";
    } catch (error) {
      console.error("Translation Error:", error);
      return null;
    }
  };
  
  export default translateText;
  