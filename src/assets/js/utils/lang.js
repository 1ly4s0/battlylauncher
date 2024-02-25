/**
 * @author TECNO BROS
 
 */

class Lang {
  async GetLang() {
    let langLocalStorage = localStorage.getItem("lang") ? localStorage.getItem("lang") : "en";
    
    try {
      const langModule = await import(`../../langs/${langLocalStorage}.js`);
      const langFile = langModule.default;
        
      return langFile;
			
    } catch (error) {
      console.error(error);
    }
  }
}

export { Lang };