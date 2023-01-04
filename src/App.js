import { BrowserRouter} from "react-router-dom";
import Element from './routes';

function App() {
  console.log(5);
  return (
    <BrowserRouter>
         <Element />
    </BrowserRouter>
  )
}
export default App;

