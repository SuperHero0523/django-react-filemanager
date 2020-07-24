import React, { useRef, useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { ContextMenu, MenuItem, ContextMenuTrigger } from "react-contextmenu";
import { Sidebar, Icon, Menu, Dropdown } from "semantic-ui-react";
import { isMobileOnly } from "react-device-detect";
import ReactHoverObserver from "react-hover-observer";
import ReactLoading from "react-loading";
import Modal from "react-modal";
import Popup from "reactjs-popup";
import Downloader from "js-file-downloader";
import { animated } from "react-spring";
import { useGesture } from "react-use-gesture";
import { useEventListener } from "../helpers/CustomHook";
import { getFilesByDirectory, uploadFiles } from "../helpers/RestAPI";
import { matchImageResource16 } from "../helpers/MatchImageResource";
import {
  availableUploadArea,
  availableDownloadArea,
} from "../helpers/AvailableArea";
import { FileView, ListView } from "../containers/Views";
import Layout from "../containers/Layout";

export const Directory = (props) => {
  Modal.setAppElement("#root");
  const fileRef = useRef();
  const [is_uploadingModal, setUploadingModal] = useState(false);
  const [is_minimized, setMinimize] = useState(false);
  const [is_uploaded, setUploaded] = useState(false);
  const [is_context, setContext] = useState(true);
  const [is_gridType, setViewType] = useState(true);
  const [order_desc, setOrder] = useState(true);
  const [file_count, setFileCount] = useState(0);
  const [total_file_count, setTotalFileCount] = useState(0);
  const [uploading_files, setUploadingFiles] = useState([]);
  const [files, setFiles] = useState([]);
  const [selected_file, setSelectedFile] = useState({});

  useEffect(() => {
    !props.location.state && props.history.push("/drive");
    getFilesByDirectory(props.location.state.name).then((res) => {
      setFiles(res);
    });
  }, [is_uploaded]);

  useEffect(() => {
    setTotalFileCount(total_file_count + file_count);
  }, [file_count]);

  const eventContextHandler = useCallback(
    (e) => {
      if (e.button === 2 && !isMobileOnly) {
        if (availableUploadArea.includes(e.target.id)) {
          setContext(true);
        } else if (availableDownloadArea.includes(e.target.className)) {
          const cur = e.target.id.split(" ")[2];
          const type = e.target.id.split(" ")[1];
          const access = e.target.id.split(" ")[3]
            ? e.target.id.split(" ")[3]
            : "";
          if (cur !== "0") {
            setContext(false);
            if (type === "file") {
              if (access === "detail") {
                const file = files.find((file) => file.id === parseInt(cur));
                setSelectedFile(file);
              }
            }
          } else {
            setSelectedFile({});
          }
        } else {
          setSelectedFile({});
        }
      }
    },
    [is_context, files]
  );

  const handleSortOrder = useCallback(
    (e) => {
      setOrder(!order_desc);
      let ordered_files = [];
      if (order_desc) {
        ordered_files = files.sort((a, b) => a.name.localeCompare(b.name));
      } else {
        ordered_files = files.sort((a, b) => b.name.localeCompare(a.name));
      }
      setFiles(ordered_files);
    },
    [order_desc, files]
  );

  const handleDropdown = (type) => {
    if (type === "upload_file") {
      fileRef.current.click();
    }
  };

  const handleClick = (e, data) => {
    if (data.foo === "upload_file") {
      fileRef.current.click();
    }
    if (data.foo === "download") {
      if (selected_file) {
        new Downloader({ url: selected_file.path })
          .then((res) => console.log(res))
          .catch((e) => console.warn(e));
      }
    }
  };

  const handleChangeFile = async (e) => {
    console.log(e.target.files);
    var formData = new FormData();
    var file_arr = [];
    Object.values(e.target.files).forEach((file) => {
      formData.append("file", file);
      file_arr.push(file);
    });
    formData.append("directory", props.location.state.name);
    setUploadingFiles((uploading_files) => uploading_files.concat(file_arr));
    setFileCount(file_count + e.target.files.length);
    setUploadingModal(true);
    uploadFiles(formData).then((response) => {
      let res_arr = [...files];
      response.forEach((file) => {
        res_arr.push(file);
      });
      setFiles(res_arr);
      setUploaded(true);
      setFileCount(0);
    });
  };

  const closeModal = () => {
    setUploadingModal(false);
    setTotalFileCount(0);
    setUploadingFiles([]);
  };

  const minimizeModal = () => {
    setMinimize(!is_minimized);
  };

  const handleChangeLayout = () => {
    setViewType(!is_gridType);
  };

  const handleShowDetail = () => {
    console.log("Show Detail View");
  };

  const bind = useGesture({
    onMouseDown: (e) => {
      if (e.button === 0) {
        if (isMobileOnly) {
          const cur = e.target.id.split(" ")[2];
          const type = e.target.id.split(" ")[1];
          if (cur !== "0") {
            if (type === "file") {
              const file = files.find((file) => file.id === parseInt(cur));
              setSelectedFile(file);
              const file_path = file.path;
              var a = document.createElement("A");
              a.href = file_path;
              a.download = file_path.substr(file_path.lastIndexOf("/") + 1);
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            }
          } else {
            setSelectedFile({});
          }
        } else {
          const cur = e.target.id.split(" ")[2];
          const type = e.target.id.split(" ")[1];
          const access = e.target.id.split(" ")[3]
            ? e.target.id.split(" ")[3]
            : "";
          if (type === "file") {
            if (access === "detail") {
              const file = files.find((file) => file.id === parseInt(cur));
              setSelectedFile(file);
            }
          }
        }
      }
    },
  });

  useEventListener("mousedown", eventContextHandler);

  return (
    <Layout>
      <div className="explorer-page">
        <Modal
          isOpen={is_uploadingModal}
          onRequestClose={closeModal}
          className="file-upload-modal"
          overlayClassName="file-upload-modal-overlay"
        >
          <div className="modal-header">
            <div className="loading-status">
              {!is_uploaded && (
                <span>
                  Uploading {file_count} {file_count > 1 ? "items" : "item"}
                </span>
              )}
              {is_uploaded && (
                <span>
                  {total_file_count} &nbsp;
                  {total_file_count > 1 ? "uploads " : "upload "}
                  completed
                </span>
              )}
            </div>
            <div className="btn-group">
              <Popup
                trigger={
                  <button className="tooltip" onClick={minimizeModal}>
                    {!is_minimized ? (
                      <svg
                        x="0px"
                        y="0px"
                        width="14px"
                        height="14px"
                        viewBox="0 0 24 24"
                        focusable="false"
                      >
                        <path
                          fill="#FFFFFF"
                          d="M21.17,5.17L12,14.34l-9.17-9.17L0,8l12,12,12-12z"
                        ></path>
                      </svg>
                    ) : (
                      <svg
                        x="0px"
                        y="0px"
                        width="14px"
                        height="14px"
                        viewBox="0 0 24 24"
                        focusable="false"
                      >
                        <path
                          fill="#FFFFFF"
                          d="M2.83,18.83L12,9.66l9.17,9.17L24,16,12,4,0,16z"
                        ></path>
                      </svg>
                    )}
                  </button>
                }
                position="bottom center"
                on="hover"
                arrow={false}
              >
                <span className="content">Minimize</span>
              </Popup>
              <Popup
                trigger={
                  <button className="tooltip" onClick={closeModal}>
                    <svg
                      x="0px"
                      y="0px"
                      width="14px"
                      height="14px"
                      viewBox="0 0 10 10"
                      focusable="false"
                      fill="#FFFFFF"
                    >
                      <polygon points="10,1.01 8.99,0 5,3.99 1.01,0 0,1.01 3.99,5 0,8.99 1.01,10 5,6.01 8.99,10 10,8.99 6.01,5 "></polygon>
                    </svg>
                  </button>
                }
                position="bottom center"
                on="hover"
                arrow={false}
              >
                <span className="content">Close</span>
              </Popup>
            </div>
          </div>
          {!is_minimized && (
            <div
              className={
                total_file_count > 10 ? "modal-body extra" : "modal-body"
              }
            >
              {Object.values(uploading_files).map((file, i) => (
                <div className="item" key={i}>
                  <div className="content">
                    <div className={!is_uploaded ? "logo loading" : "logo"}>
                      <img src={matchImageResource16(file)} alt={file.name} />
                    </div>
                    <div className={!is_uploaded ? "name loading" : "name"}>
                      <span>{file.name}</span>
                      <span></span>
                    </div>
                    <div className="status">
                      {!is_uploaded ? (
                        <ReactLoading
                          type="spin"
                          color="#929292"
                          className="loading"
                        />
                      ) : (
                        <div className="icon">
                          <ReactHoverObserver>
                            {({ isHovering }) => (
                              <React.Fragment>
                                {isHovering ? (
                                  <svg
                                    width="24px"
                                    height="24px"
                                    viewBox="0 0 24 24"
                                    focusable="false"
                                  >
                                    <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"></path>
                                  </svg>
                                ) : (
                                  <svg
                                    width="24px"
                                    height="24px"
                                    viewBox="0 0 24 24"
                                    fill="#0F9D58"
                                  >
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path>
                                  </svg>
                                )}
                              </React.Fragment>
                            )}
                          </ReactHoverObserver>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Modal>
        <ContextMenuTrigger id="context-menu">
          <Sidebar as={Menu} vertical visible={true}>
            <Dropdown text="New" icon={null} labeled className="button-tool">
              <Dropdown.Menu>
                <Dropdown.Item
                  icon="folder outline"
                  label="New folder"
                  onClick={(e) => handleDropdown("new_folder")}
                ></Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item
                  icon="upload"
                  label="Upload files"
                  onClick={(e) => handleDropdown("upload_file")}
                ></Dropdown.Item>
                <Dropdown.Item
                  icon="folder outline"
                  label="Upload folder"
                  onClick={(e) => handleDropdown("upload_folder")}
                ></Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item
                  icon="google"
                  label="Google Docs"
                  onClick={(e) => handleDropdown("google_docs")}
                ></Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
            <Menu.Item as={Link} to="/drive">
              <svg
                width="24px"
                height="24px"
                viewBox="0 0 24 24"
                fill="#000000"
                focusable="false"
              >
                <path d="M19 2H5c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 18H5v-1h14v1zm0-3H5V4h14v13zm-9.35-2h5.83l1.39-2.77h-5.81zm7.22-3.47L13.65 6h-2.9L14 11.53zm-5.26-2.04l-1.45-2.52-3.03 5.51L8.6 15z"></path>
              </svg>
              <span>My Drive</span>
            </Menu.Item>
          </Sidebar>
          <div className="page-container">
            <div className="page-navbar">
              <div className="navbar-dropdown-menu">
                <Dropdown text="My Drive" labeled className="navbar-dropdown">
                  <Dropdown.Menu>
                    <Dropdown.Item
                      icon="folder outline"
                      label="New folder"
                      onClick={(e) => handleDropdown("new_folder")}
                    ></Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item
                      icon="upload"
                      label="Upload files"
                      onClick={(e) => handleDropdown("upload_file")}
                    ></Dropdown.Item>
                    <Dropdown.Item
                      icon="folder outline"
                      label="Upload folder"
                      onClick={(e) => handleDropdown("upload_folder")}
                    ></Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item
                      icon="google"
                      label="Google Docs"
                      onClick={(e) => handleDropdown("google_docs")}
                    ></Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </div>
              <div className="navbar-tools">
                <button className="btn-layout" onClick={handleChangeLayout}>
                  {is_gridType ? (
                    <svg
                      width="24px"
                      height="24px"
                      viewBox="0 0 24 24"
                      focusable="false"
                      fill="#000000"
                    >
                      <path d="M3,5v14h18V5H3z M7,7v2H5V7H7z M5,13v-2h2v2H5z M5,15h2v2H5V15z M19,17H9v-2h10V17z M19,13H9v-2h10V13z M19,9H9V7h10V9z"></path>
                    </svg>
                  ) : (
                    <svg
                      width="24px"
                      height="24px"
                      viewBox="0 0 24 24"
                      fill="#000000"
                    >
                      <path d="M2,5v14h20V5H2z M14,7v4h-4V7H14z M4,7h4v4H4V7z M16,11V7h4v4H16z M4,17v-4h4v4H4z M10,17v-4h4v4H10z M20,17 h-4v-4h4V17z"></path>
                      <path d="M0 0h24v24H0z" fill="none"></path>
                    </svg>
                  )}
                </button>
                <button className="btn-layout" onClick={handleShowDetail}>
                  <svg
                    width="24px"
                    height="24px"
                    viewBox="0 0 24 24"
                    fill="#000000"
                  >
                    <path d="M0 0h24v24H0z" fill="none"></path>
                    <path d="M11 17h2v-6h-2v6zm1-15C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM11 9h2V7h-2v2z"></path>
                  </svg>
                </button>
              </div>
            </div>
            <div className="context-area">
              <div className="layout-view">
                <div className="layout-content file">
                  <div className="layout-header">
                    {is_gridType && <h2>Files</h2>}
                    {!is_gridType && (
                      <div className="list-tool">
                        <div className="td-name">
                          <span>Name</span>
                          <button class="direction" onClick={handleSortOrder}>
                            {order_desc ? (
                              <svg
                                width="18px"
                                height="18px"
                                viewBox="0 0 48 48"
                                focusable="false"
                                fill="#000000"
                              >
                                <path fill="none" d="M0 0h48v48H0V0z"></path>
                                <path d="M8 24l2.83 2.83L22 15.66V40h4V15.66l11.17 11.17L40 24 24 8 8 24z"></path>
                              </svg>
                            ) : (
                              <svg
                                width="18px"
                                height="18px"
                                viewBox="0 0 48 48"
                                focusable="false"
                                fill="#000000"
                              >
                                <path fill="none" d="M0 0h48v48H0V0z"></path>
                                <path d="M40 24l-2.82-2.82L26 32.34V8h-4v24.34L10.84 21.16 8 24l16 16 16-16z"></path>
                              </svg>
                            )}
                          </button>
                        </div>
                        <div className="td-owner">
                          <span>Owner</span>
                        </div>
                        <div className="td-modified">
                          <span>Last modified</span>
                        </div>
                        <div className="td-size">
                          <span>File size</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="main-content" id="detail-view">
                    {is_gridType &&
                      files.map((item, i) => (
                        <animated.div
                          {...bind()}
                          className={
                            selected_file && item.id === selected_file.id
                              ? "guesture active"
                              : "guesture"
                          }
                          id={"guesture file " + item.id + " detail"}
                          key={i}
                        >
                          <FileView
                            path={item.path}
                            type={item.content_type}
                            name={item.name}
                            id={item.id}
                            access="detail"
                          />
                        </animated.div>
                      ))}
                    {!is_gridType && (
                      <div className="list-group">
                        {files.map((item, i) => (
                          <animated.div
                            {...bind()}
                            className={
                              selected_file && item.id === selected_file.id
                                ? "guesture active"
                                : "guesture"
                            }
                            id={"guesture file " + item.id}
                            key={i}
                          >
                            <ListView
                              owner=""
                              last_modified={item.modified_date}
                              type={item.content_type}
                              name={item.name}
                              size={item.size}
                              id={item.id}
                            />
                          </animated.div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <ContextMenu id="context-menu">
            {is_context ? (
              <React.Fragment>
                <MenuItem data={{ foo: "new_folder" }} onClick={handleClick}>
                  <Icon name="folder outline" /> New folder
                </MenuItem>
                <MenuItem divider />
                <MenuItem data={{ foo: "upload_file" }} onClick={handleClick}>
                  <Icon name="upload" /> Upload files
                  <input
                    type="file"
                    hidden
                    multiple
                    onChange={handleChangeFile}
                    ref={fileRef}
                  />
                </MenuItem>
                <MenuItem divider />
                <MenuItem data={{ foo: "google_doc" }} onClick={handleClick}>
                  <Icon name="google" /> Google Docs
                </MenuItem>
              </React.Fragment>
            ) : (
              <React.Fragment>
                <MenuItem data={{ foo: "download" }} onClick={handleClick}>
                  <Icon name="cloud download" /> Download
                </MenuItem>
              </React.Fragment>
            )}
          </ContextMenu>
        </ContextMenuTrigger>
      </div>
    </Layout>
  );
};
