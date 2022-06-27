
import DraggableList from "react-draggable-list";
import { React, useEffect, useRef, useState } from "react";
import Cookies from 'js-cookie';
import dailiesJson from './defaultdailies.json';
import './App.css';
import deleteImg from './delete.png';
import dragImg from './drag-icon.png';
import logoImg from './dailyscapewhitecropped.png';

const defaultDailies = Object.values(dailiesJson).map((daily) => ({ id: daily['name'] }));

const Item = ({ item, itemSelected, anySelected, dragHandleProps, commonProps }) => {
  const { onMouseDown, onTouchStart } = dragHandleProps;

  return (
    <div className="disable-select dailyRow">
      <input type="checkbox" checked={item.complete} id={item.id} onChange={(e) => commonProps.pressButton(e, item.id)}></input>
      {/*<a href={"alt1://openapp/https://runeapps.org/apps/alt1/nemiforest/appconfig.json"}>*/}
        <label htmlFor={item.id}>
          {
            item.link !== undefined ?
              <a href={item.link}>{item.id}</a>
              :
              item.id
          }
        </label>
      <img
        src={dragImg}
        className="disable-select dragHandle"
        onTouchStart={(e) => {e.preventDefault(); onTouchStart(e);}}
        onMouseDown={(e) => {onMouseDown(e);}}
      />
      <div className='right'>
        <div className="NOTtooltip">
          <img className='deleteButton'
            src={deleteImg}
            onClick={(e) => commonProps.deleteItem(e, item.id)} />
          {/*<span className='tooltiptext'>Remove permanently</span>*/}
        </div>
      </div>
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
      Cookies.set('dailies', JSON.stringify(dailies), { expires: 365 });
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
        .map((daily) => ({ id: daily['name'], complete: isDailyComplete(daily), link: daily.link === undefined ? undefined : daily.link }))
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
    var selValue = document.getElementById('SortOption').value;
    if(selValue == "Sort") {selValue = "Personal";}
    return _sortOptions[selValue];
  };

  const _getSortMethodName = () => {
    return document.getElementById('SortOption').value;
  };

  const _allowDraggable = (e) => {
    //e.target.selectedIndex = 0
    document.querySelectorAll('.dragHandle').forEach(
      (ele) => ele.style.visibility = _getSortMethodName() == 'Personal' ? '' : 'hidden'
    );
    _updateList();
  }

  const _onDailyCreate = (e) => {
    var nameEle = document.getElementById('popupName');
    var freq = document.getElementById('popupFreq').value;
    var link = document.getElementById('popupLink').value;
    if(nameEle.value == "" || dailies[nameEle.value] != null) {
      nameEle.classList.add("error");
      setTimeout(function() {
        nameEle.classList.remove("error");
      }, 500);
      return;
    }
    dailies[nameEle.value] = {"name": nameEle.value, "freq": freq, priority: -1};
    if(link !== "") {dailies[nameEle.value].link = link;}
    _togglePopup();
    _updateList();
    document.querySelectorAll("#popup input[type='text']").forEach((ele) => ele.value = "");
  };

  const _togglePopup = () => {
    var popup = document.getElementById('popup');
    var isShown = popup.style.display == "block";
    popup.style.display = isShown ? "none" : "block";
  };

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
    <div className={window.alt1 ? "" : "notAltOne"}>
      {/* //Popup Task creation box */}
      <div id="popup">
        <h4>Create a custom task</h4>
        <div id="popupVitalRow" className="popupRow">
          <input type="text" placeholder="Enter name" id="popupName"></input>
          <select id="popupFreq">
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        <input type="text" placeholder="Enter link (optional)" id="popupLink"></input>
        <div className="popupRow">
          <button type="submit" id="create" onClick={_onDailyCreate}>Create</button>
          <button type="submit" id="cancel" onClick={_togglePopup}>Cancel</button>
        </div>
      </div>

      {/* //App header + options */}
      <div className="AppOptions">
        <div className="dropdown dropdown-dark">
          <input className="tgl tgl-flip" id="legacyBox" type="checkbox" />
          <label className="tgl-btn" data-tg-off="▼" data-tg-on="✓" id="sortButton" htmlFor="legacyBox"/>
          <select id="SortOption" className="dropdown-select" onChange={_allowDraggable}>
            {
              Object.keys(_sortOptions).map(sortName => 
                <option value={sortName}>{sortName}</option>
              )
            }
          </select>
        </div>
        <div id='logoImgContainer'>
          <img id='logoImg' src={logoImg}/>
        </div>
        
        <input className="tgl tgl-flip" id="test" type="checkbox" />
        <label className="tgl-btn addNew" data-tg-off="+" data-tg-on="✓" htmlFor="test" onClick={(e) => {
            e.preventDefault();
            _togglePopup();
          }}
        ></label>
        <input className="tgl tgl-flip" id="ShowComplete" onChange={_updateList} type="checkbox" />
        <label className="tgl-btn" data-tg-off="▢" data-tg-on="✓" htmlFor="ShowComplete"></label>
      </div>
      
      {/* //Main body (list) */}
      <div ref={containerRef} className="draggableListContainer">
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