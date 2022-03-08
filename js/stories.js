"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story) {
  // console.debug("generateStoryMarkup", story);

  const hostName = story.getHostName();
  return $(`
      <li id="${story.storyId}">
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
      </li>
    `);
}

/** Gets list of stories from server, generates their HTML, and puts on page. */

 function putStoriesOnPage() {
  console.debug("putStoriesOnPage");

  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    // Adds the additional fav star button w/ it's function
    // Updates the API first and then changes the UI
    function toggleFavorites() {
      let notFavorite = 'far fa-star';
      let favorited = 'fa-star fas';

      // Updates the UI highlighting the star and updates User
      if ($(this).attr('class') === notFavorite) {
        // If it's not favorite => make it favorite
        let parentOfFav = $(this).parent().attr('id');
        let url = $(this).next().attr('href');
        let title = $(this).next().text().trim()
        let author = $(this).siblings().eq(2).text().replace('by','').trim()
        // API
        currentUser.addFavorite(parentOfFav)

        // UI
        $(this).attr('class', favorited);

        let newFavStory = new Story({storyId: parentOfFav, title, author, url, username: currentUser.username})
        currentUser.favorites.push(newFavStory);

      } else {
        // If it's favorite => make it un-favorite
        let parentOfFav = $(this).parent().attr('id');

        // API
        currentUser.removeFavorite(parentOfFav)

        // UI
        $(this).attr('class', notFavorite)
        currentUser.favorites.splice(currentUser.favorites.indexOf($(this).parent()), 1)
      }

    }
    const storyIdforFav = $story[0].getAttribute('id');
    let UnfavoriteStar = $('<i>').attr('class','far fa-star').on('click', toggleFavorites);
    let favoriteStar = $('<i>').attr('class','fa-star fas').on('click', toggleFavorites);
    if ( currentUser.favorites.find(function(value){
      return value.storyId === storyIdforFav
    }) ) {
      // if its favorited
      $story.prepend(favoriteStar)
    } else {
      // otherwise
      $story.prepend(UnfavoriteStar)
    }

    $allStoriesList.append($story);
    
  }

  $allStoriesList.show();
}

// Calls the addStory method which adds the 
//  *story data into the API
//  *creates a Story instance  with the data and adds to storyList and 
//  user.ownstories
async function submitStory(e) {
  console.debug('submitStory');

  e.preventDefault();

  // Contains all the data for the new story submitted
  const title = $('#create-story-title').val();
  const author = $('#create-story-author').val();
  const url = $('#create-story-url').val();

  // Updates the API 
  let newStory = await storyList.addStory(currentUser,{title,author,url});
  // Creates a story markup with appropriate elements
  let generatedStory = generateStoryMarkup(newStory);
  // Updates the UI to add the newStory w/ the favorites feature included
  function addFavoriteNew(){
    // API Change
    currentUser.addFavorite($(this).parent().attr('id'))
    // UI data Change
    const storyId = $(this).parent().attr('id');
    const title = $(this).siblings().eq(0).text().trim();
    const url = $(this).siblings().eq(0).attr('href');
    const author = $(this).siblings().eq(2).text().replace('by','').trim();
    const username = currentUser.username;
    currentUser.favorites.push(new Story({storyId,title,author,url,username}))
  
    // UI Change
    $(this).attr('class', 'fa-star fas');
    // Deleting favorites method
    function deleteFavNew(){
      // If already favorited
      if ($(this).attr('class') == 'fa-star fas') {
      // API change 
      currentUser.removeFavorite($(this).parent().attr('id'))
      // UI Data Change
      const favIdx = currentUser.favorites.findIndex(function(value){
        return value.storyId == $(this).parent().attr('id')
      })
      currentUser.favorites.splice(favIdx,1)
      // UI physical change
      $(this).attr('class', 'far fa-star')
      }
    }
    $(this).on('click', deleteFavNew)
  
  }
  let UnfavoriteStar = $('<i>').attr('class','far fa-star').on('click', addFavoriteNew)
  $allStoriesList.prepend(generatedStory.prepend(UnfavoriteStar));

  // Hide the form after submitting
  $('#create-story').attr('class','hidden')
  $('#create-story-title').val("")
  $('#create-story-author').val("")
  $('#create-story-url').val("")


}

$('#create-story-button').on('click',submitStory)

// Shows only the favorites
function toggleFavoritesBar() {
  $allStoriesList.empty()

  for (let favs of currentUser.favorites){

    function removeFromFav() {
      // remove from list
      let parentOfFav = $(this).parent().attr('id');
      $(this).parent().remove()

      // API
      currentUser.removeFavorite(parentOfFav)

      // UI DATA
      currentUser.favorites.splice(currentUser.favorites.indexOf(parentOfFav), 1)
    }

    const favorited = $('<i>').attr('class', 'fa-star fas').on('click', removeFromFav)
    $allStoriesList.append(generateStoryMarkup(favs).prepend(favorited))
  }

}
$('#nav-favorites').on('click', toggleFavoritesBar)

// Show only currentUser's ownstories
function toggleOwnStories() {
  // Clears all stories
  $allStoriesList.empty()
  // Appends each "ownstories" along w/ favorites functionality
  for (let ownStories of currentUser.ownStories) {

    if ( currentUser.favorites.find(function(value){
      return value.storyId == ownStories.storyId;
    }) ) {
      // ownstories that are favorites

      function removeFav(){
        // API change
        currentUser.removeFavorite(ownStories.storyId)
        // UI change
        currentUser.favorites.splice(currentUser.favorites.indexOf(ownStories),1)
        $(this).attr('class', 'far fa-star')
      }
      const favorited = $('<i>').attr('class', 'fa-star fas').on('click',removeFav);
      let trash = $('<i>').attr('class','fas fa-trash-alt').on('click',function(){
        // API Update
        const storyId = $(this).parent()[0].getAttribute('id');
        storyList.deleteStory(currentUser, storyId)
        // UI data update
        $(this).parent().remove()

      });

      // Add an editing button
      // .fa-solid fa-pen-to-square
      


      $allStoriesList.append(generateStoryMarkup(ownStories).prepend(favorited).prepend(trash));

    } else {
      // ownstories that aren't favorites
      function addFav(){
        // API change
        currentUser.addFavorite(ownStories.storyId)
        // UI change
        const storyId = ownStories.storyId;
        const title = ownStories.title;
        const author = ownStories.author;
        const url = ownStories.url;
        const username = currentUser.username;

        currentUser.favorites.push(new Story({storyId,title,author,url,username}))
        $(this).attr('class', 'fa-star fas')
      }
      const UnfavoriteStar = $('<i>').attr('class','far fa-star').on('click',addFav);
      let trash = $('<i>').attr('class','fas fa-trash-alt').on('click', function(){
        // API update
        const storyId = $(this).parent()[0].getAttribute('id');
        storyList.deleteStory(currentUser, storyId)
        // UI change
        $(this).parent().remove();
      });

      // Add an editing button
      // .fa-solid fa-pen-to-square
      function editStory(){
        // The post's id
        const parentId = $(this).parent().attr('id');
        // The change form's inputs
        const title = $('<input>').attr('type','text').attr('placeholder', 'title').attr('id','editTitle');
        const author = $('<input>').attr('type','text').attr('placeholder','author').attr('id','editAuthor');
        const url = $('<input>').attr('type','text').attr('placeholder','url').attr('id','editURL')
        // The function for the form when the submit button is clicked
        function submitEditForm(e){
          // Prevents refresh
          e.preventDefault()
          // Values of the inputs
          let newTitle = $('#editTitle').val();
          let newAuthor = $('#editAuthor').val();
          let newURL = $('#editURL').val();
          // The patch data to be changed
          const changedValues = {title: newTitle, author: newAuthor, url: newURL}
          
          // Removes the object if the input is empty
          if (newTitle == '') {
            delete changedValues.title;
          };

          if (newAuthor == '') {
            delete changedValues.author
          };

          if (newURL == '') {
            delete changedValues.url
          };
          // Calls the editStory functionality which updates story
          storyList.editStory(currentUser, parentId, changedValues)
          // Update $allstorieslist
          const $allStoriesListIdx = Array.from($('#all-stories-list').children()).findIndex(function(value){
            return $(value).attr('id') == parentId
                                 
          });

          if (changedValues.title !== undefined) {
            // Change title
            $allStoriesList.children().eq($allStoriesListIdx).children().eq(3).text(changedValues.title)
          }

          if (changedValues.author !== undefined){
            // Change author
            $allStoriesList.children().eq($allStoriesListIdx).children().eq(5).text(`by ${changedValues.author}`)
         
          }

          if (changedValues.url !== undefined) {
            // Change URL
            const newURL = new URL(changedValues.url).host
            $allStoriesList.children().eq($allStoriesListIdx).children().eq(3).attr('href',changedValues.url);
            $allStoriesList.children().eq($allStoriesListIdx).children().eq(4).text(`(${newURL})`)
            
          } 


          // Removes the form 
          $(this).parent().remove()
        }
        // The submit button for the  form
        const submit = $('<input>').attr('type','submit').attr('id','editSubmit').on('click',submitEditForm)
        // The form itself where you edit the story
        const editForm = $('<form>').append(title).append(author).append(url).append(submit)

        // If there are 6 siblings then there isn't a form
        // Therefore, form is appended
        if ($(this).siblings().length === 6) {
          $(this).parent().append(editForm)
        } else {
          // Otherwise, remove the last sibling which is the form
          $(this).siblings().eq(6).remove()
        }
        
      }
      // The edit pencil
      const edit = $('<i>').attr('class','fa fa-pencil-alt').on('click',editStory)

      // Appends the story which is prepended all the different button functionalites
      // Such as delete, edit, favorites
      $allStoriesList.append(generateStoryMarkup(ownStories).prepend(UnfavoriteStar).prepend(trash).prepend(edit));
      
    }

    

  }


}
$('#nav-my-stories').on('click',toggleOwnStories)

// If there are no users then starting page is login/signup
// Disables the Hack or Snooze being click-able
if (currentUser == undefined) {
  navLoginClick()
  $('#nav-all').css('pointer-events','none')
}

// to-Patch: 

// create an editing button in my stories
// .fa-solid fa-pen-to-square

// user.js login and signup form, remove the try and catch replace w/ 
// .then((response)) => {**INSERT LOGIN/SIGNUP COMMANDS}, (error) => {alert('Invalid credentials')}

// use transform request to be able to change username and password
// const response = axios({
//   method: 'POST',
//   url: /**insert url */,
//   data: {
//     username: /**username */,
//     password: /**password */
//   },
//   transformRequest: [(data, headers) => {
//     /** insert change */

//     return data;
//   }]

// });

// use bootstrap and make HTML presentable to mobile devices

// add infinite scroll, load more stories when scroll hits to bottom of page

