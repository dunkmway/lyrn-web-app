import app from "./_firebase";
import { goHome, getCurrentUser } from "./_authorization";
import { collection, doc, getDoc, getDocs, getFirestore, orderBy, query, where } from "firebase/firestore";

const db = getFirestore(app);

const CACHED_TOPICS = {
    english: null,
    math: null,
    reading: null,
    science: null
}

window.goHome = goHome;
window.changeSection = changeSection;
window.goBack = goBack;

window.addEventListener('DOMContentLoaded', initialize);

function initialize() {

}

function goBack() {
    const main = document.querySelector('main');
    const wrapper = document.getElementById("sectionWrapper");

    //hide section and show main
    wrapper.style.display = 'none';
    main.style.display = 'block';
}

async function changeSection(section) {
    const main = document.querySelector('main');
    const wrapper = document.getElementById("sectionWrapper");
    const sectionTitle = document.getElementById('sectionTitle');

    // change the accent color
    changeAccentColor(section);

    // add in the title
    sectionTitle.textContent = section[0].toUpperCase() + section.substring(1);

    // get the section curriculum
    const curriculumDocs = await getCurriculum(section);
    renderTopics(curriculumDocs);

    // hide main and show the section
    main.style.display = 'none';
    wrapper.style.display = 'block';
}

/**
 * change the css variable --accent-color to the variable --${sectionName}-color
 * @param {String} sectionName name of section
 */
function changeAccentColor(sectionName) {
    document.querySelector(':root').style.setProperty('--accent-color', `var(--${sectionName}-color)`)
    document.querySelector(':root').style.setProperty('--accent-color-light', `var(--${sectionName}-color-light)`)
}

async function getCurriculum(section) {
    // curriculum is cached?
    if (CACHED_TOPICS[section]) {
        return CACHED_TOPICS[section]
    }

    const sectionQuery = await getDocs(
        query(
            collection(db, 'ACT-Curriculum-Data'),
            where('sectionCode', '==', section),
        )
    );
    const sorted = sectionQuery.docs.sort((a,b) => (b.data().numQuestions ?? 0) - (a.data().numQuestions ?? 0));

    CACHED_TOPICS[section] = sorted;
    return sorted;
}

function renderTopics(topicDocs) {
    const wrapper = document.getElementById('topics');

    removeAllChildNodes(wrapper);

    topicDocs.forEach(topicDoc => {
        const data = topicDoc.data();
        const id = topicDoc.id;

        let topic = document.createElement('div');
        topic.className = 'bubble small accent-back';
        topic.id = id;
        topic.innerHTML = `
        <p>${data.code}</p>
        `

        wrapper.appendChild(topic)
    })

}

function removeAllChildNodes(parent) {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
  }
