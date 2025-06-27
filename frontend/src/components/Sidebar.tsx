import ListAltIcon from "@mui/icons-material/ListAlt";
import FavoriteIcon from "@mui/icons-material/Favorite";
import BlockIcon from "@mui/icons-material/Block";
import BusinessIcon from "@mui/icons-material/Business";
import DashboardIcon from "@mui/icons-material/Dashboard";
import { SidebarComponentProps } from "../types";

const collectionIcon = (name: string) => {
  if (name.toLowerCase().includes("liked"))
    return <FavoriteIcon fontSize="small" className="mr-2" />;
  if (name.toLowerCase().includes("ignore"))
    return <BlockIcon fontSize="small" className="mr-2" />;
  if (name.toLowerCase().includes("list"))
    return <ListAltIcon fontSize="small" className="mr-2" />;
  return <BusinessIcon fontSize="small" className="mr-2" />;
};

const Sidebar = ({
  collections,
  selectedCollectionId,
  setSelectedCollectionId,
}: SidebarComponentProps) => (
  <aside className="bg-white rounded-none shadow flex flex-col border-r border-gray-200 flex-shrink-0">
    <div className="font-bold text-xl border-b p-6 text-left text-black">
      Harmonic Jam
    </div>
    <div className="flex-1 overflow-y-auto px-4 pt-4">
      {/* Master List Section */}
      <div className="mb-6">
        <div
          className={`flex items-center py-2 pl-4 pr-4 rounded-lg cursor-pointer transition font-medium text-base
            ${
              selectedCollectionId === "all-companies"
                ? "bg-blue-100 text-blue-900 font-bold border-2 border-blue-300"
                : "hover:bg-gray-100 text-gray-700 border-2 border-transparent"
            }`}
          onClick={() => setSelectedCollectionId("all-companies")}
        >
          <DashboardIcon fontSize="medium" className="mr-3" />
          <span className="truncate">All Companies</span>
        </div>
      </div>

      {/* Horizontal Divider */}
      <div className="border-t border-gray-300 mb-6"></div>

      {/* Collections Section */}
      <p className="font-bold  mb-2 pb-2 text-left text-black">Collections</p>
      <div className="flex flex-col gap-2 text-left">
        {collections?.map((collection) => (
          <div
            key={collection.id}
            className={`flex items-center py-1 pl-4 pr-4 rounded-lg cursor-pointer transition font-medium
              ${
                selectedCollectionId === collection.id
                  ? "bg-blue-100 text-blue-900 font-bold border-2 border-blue-300"
                  : "hover:bg-gray-100 text-gray-700 border-2 border-transparent"
              }`}
            onClick={() => setSelectedCollectionId(collection.id)}
          >
            {collectionIcon(collection.collection_name)}
            <span className="truncate">{collection.collection_name}</span>
          </div>
        ))}
      </div>
    </div>
  </aside>
);

export default Sidebar;
