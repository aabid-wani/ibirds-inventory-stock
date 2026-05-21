import Sidebar from "./Sidebar"
import Header from "./Header";
const Main = ({ children }) => {
  // console.log('children-->>', children?.props?.children);
  return (
    <div className="wrapper">
      <Sidebar />
      <div id="content">
        <Header />
        <div className="px-4">
        {/* {children && children} */}
        {children}
        </div>
      </div>
    </div>
  );
};

export default Main;

