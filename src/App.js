
import DraggableList from "react-draggable-list";
import { React, useEffect, useRef, useState } from "react";
import Cookies from 'js-cookie';
import dailiesJson from './defaultdailies.json';
import './App.css';
import deleteImg from './delete.png';

const defaultDailies = Object.values(dailiesJson).map((daily) => ({ id: daily['name'] }));

const Item = ({ item, itemSelected, anySelected, dragHandleProps, commonProps }) => {
  const { onMouseDown, onTouchStart } = dragHandleProps;

  return (
    <div
      className="disable-select"
      style={{
        border: "1px solid black",
        margin: "4px",
        padding: "10px",
        display: "flex",
        justifyContent: "space-around",
        background: "#fff",
        userSelect: "none"
      }}
    >
      <input type="checkbox" checked={item.complete} id={item.id} onChange={(e) => commonProps.pressButton(e, item.id)}></input>
      <label htmlFor={item.id}>{item.id}</label>
      <div
        className="disable-select dragHandle"
        style={{
          fontWeight: "600",
          transform: "rotate(90deg)",
          width: "20px",
          height: "20px",
          backgroundColor: "black"
        }}
        onTouchStart={(e) => {
          e.preventDefault();
          console.log("touchStart");
          e.target.style.backgroundColor = "blue";
          document.body.style.overflow = "hidden";
          onTouchStart(e);
        }}
        onMouseDown={(e) => {
          console.log("mouseDown");
          document.body.style.overflow = "hidden";
          onMouseDown(e);
        }}
        onTouchEnd={(e) => {
          e.target.style.backgroundColor = "black";
          document.body.style.overflow = "visible";
        }}
        onMouseUp={() => {
          document.body.style.overflow = "visible";
        }}
      ></div>
      <img className='deleteRow' src={deleteImg} onClick={(e) => commonProps.deleteItem(e, item.id)} />
    </div>
  );
};

export default function App() {
  if(window.alt1) {
    window.alt1.identifyAppUrl("./appconfig.json");
  }

  const [list, setList] = useState(defaultDailies);
  const [dailies, setDailies] = useState(dailiesJson);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if(!loaded) {
      setLoaded(true);
      var settings = Cookies.get('dailies');
      if(settings == null) {return;}
      setDailies(JSON.parse(settings));
    } else {
      _updateList(_sortOptions['Personal'], false);
      Cookies.set('dailies', JSON.stringify(dailies));
    }
  }, [dailies]);

  const isDailyComplete = (daily) => {
    var today = new Date();
    if(daily == null || daily['last'] == null || daily['freq'] == null) {return false;}
    if(daily['freq'] == 'daily') {
      if(daily.last >= +Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())) {return true;}
    } else if(daily['freq'] == 'weekly') {
      if(daily.last >= +Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - (today.getUTCDay() < 3 ? today.getUTCDay() + 7 : today.getUTCDay()) + 3)) {return true;}
    } else if(daily['freq'] == 'monthly') {
      if(daily.last >= +Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1)) {return true;}
    }
    return false;
  };

  const containerRef = useRef();

  const _updateList = () => {
    setList(
      Object.values(dailies)
        .map((daily) => ({ id: daily['name'], complete: isDailyComplete(daily) }))
        .filter((daily) => _getShowComplete() ? isDailyComplete(dailies[daily['id']]) : !isDailyComplete(dailies[daily['id']]))
        .sort(_getSortMethod())
    );
  }

  const _sortOptions = {
    Personal: (a, b) => dailies[a['id']]['priority'] - dailies[b['id']]['priority'],
    Alphabetical: (a, b) => a['id'].localeCompare(b['id'])
  };

  const _getShowComplete = () => {
    return document.getElementById('ShowComplete').checked;
  }

  const _getSortMethod = () => {
    return _sortOptions[document.getElementById('SortOption').value];
  };

  const _getSortMethodName = () => {
    return document.getElementById('SortOption').value;
  };

  const _allowDraggable = (e) => {
    document.querySelectorAll('.dragHandle').forEach(
      (ele) => ele.style.visibility = _getSortMethodName() == 'Personal' ? '' : 'hidden'
    );
    _updateList();
  }

  const _onListChange = (newList) => {
    var newDailies = {...dailies};
    for(var i = 0; i < newList.length; i++) {
      newDailies = {...newDailies, 
        [newList[i]['id']]: {...dailies[newList[i]['id']], priority: i}};
    }
    setDailies(newDailies);
  };

  const onButtonPress = (e, id) => {
    setDailies({...dailies, [id]: {...dailies[id], last: e.target.checked ? +new Date() : null}});
  }

  const onItemDelete = (e, id) => {
    var newDailies = {...dailies};
    delete newDailies[id];
    setDailies(newDailies);
  };

  return (
    <div className="App">
      <div className="AppOptions">
        <select id="SortOption" onChange={_allowDraggable}>
          {
            Object.keys(_sortOptions).map(sortName => 
              <option value={sortName}>{sortName}</option>
            )
          }
        </select>
        <label className="switch">
          <input type="checkbox" id='ShowComplete' onChange={_updateList}/>
          <span className="slider"></span>
        </label>
      </div>

      <div
        ref={containerRef}
        style={{ touchAction: "pan-y", background: "beige" }}
      >
        <DraggableList
          itemKey="id"
          template={Item}
          list={list}
          onMoveEnd={(newList) => _onListChange(newList)}
          container={() => containerRef.current}
          commonProps={{pressButton: onButtonPress, deleteItem: onItemDelete}}
        />
      </div>
    </div>
  );
}