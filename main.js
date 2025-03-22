class View {
    constructor() {
        this.app = document.getElementById('app');

        this.title = this.createElement('h1', 'title');

        this.searchLine = this.createElement('div', 'search-line');
        this.searchInput = this.createElement('input' , 'search-input');
        this.searchCounter = this.createElement('span', 'counter');
        this.searchLine.append(this.searchInput);
        this.searchLine.append(this.searchCounter);
        this.repoList = this.createElement('div', 'repo-list');

        this.dropdown = this.createElement('ul', 'dropdown');
        this.dropdown.style.display = 'none';


        this.searchLine.append(this.dropdown);
        this.app.append(this.searchLine, this.repoList);

        this.usersWrapper = this.createElement('div', 'users-wrapper');
        this.usersList = this.createElement('ul', 'users');
        this.usersWrapper.append(this.usersList);

        this.main = this.createElement('div', 'main');
        this.main.append(this.usersWrapper);

        this.app.append(this.title);
        this.app.append(this.searchLine);
        this.app.append(this.main);

        this.addedRepos = [];
    }
    createElement(elementTag, elementClass) {
        const element = document.createElement(elementTag);
        if(elementClass) {
            element.classList.add(elementClass);
        }
        return element;
    }

    createUser(userData) {
        const userElement = this.createElement('span', 'user-prev');
        userElement.insertAdjacentHTML('beforeend', `<span class="user-prev-name">${userData.name}</span>`);
        this.usersList.append(userElement);

        userElement.addEventListener("click", () => {
            const allUsers = document.querySelectorAll('.user-prev');
            allUsers.forEach(user => user.classList.remove('highlighted'));

            userElement.classList.add('highlighted');

            const repoItem = this.createElement('div', 'repo-item');
            repoItem.insertAdjacentHTML('beforeend', `<div class="repo-info">
                                  <span>Name: ${userData.name}</span>
                                  <span>Owner: ${userData.owner.login}</span>
                                  <span>Stars: ${userData.stargazers_count}</span>
                                  </div>
                                  <button class="remove-btn">X</button>`);

                this.addedRepos.push(repoItem);



                if(this.addedRepos.length > 3){
                    const oldestRepo = this.addedRepos.shift();
                    oldestRepo.remove();
                }

                this.repoList.append(repoItem);

                this.searchInput.value = '';
                this.usersList.textContent = ''; 
                this.dropdown.style.display = 'none';
                
                repoItem.querySelector('.remove-btn').addEventListener('click', (event) => {
                event.stopPropagation();
                repoItem.remove();

                this.addedRepos = this.addedRepos.filter(item => item !== repoItem);


            });

    });
    }
}
    

const USER_PER_PAGE = 5;

class Search {
    constructor(view) {
        this.view = view;
        this.abortController = null;

        this.debouncedSearchUsers = this.debounce(this.searchUsers.bind(this), 400);

        this.view.searchInput.addEventListener('keyup', this.searchUsers.bind(this))
    }

    debounce(func, delay) {
        let timeout;
        return function (...args) {
          clearTimeout(timeout);
          timeout = setTimeout(() => func.apply(this, args), delay);
        };
      }
    

    async searchUsers(){

        this.view.usersList.textContent = '';
        const query = this.view.searchInput.value.trim();
        

        if (this.abortController) {
            this.abortController.abort();
        }

        this.abortController = new AbortController();

        this.view.usersList.replaceChildren();

        try {
            const response = await fetch(
                `https://api.github.com/search/repositories?q=${this.view.searchInput.value}&per_page=${USER_PER_PAGE}`,
                { signal: this.abortController.signal }
            );

            if (response.ok) {
                const data = await response.json();
                data.items.forEach(user => this.view.createUser(user));
            } else {
                console.error("Error fetching users");
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Запрос был отменен');
            } else {
                console.error('Ошибка при выполнении запроса:', error);
            }
        } finally {
            this.abortController = null;
        }
    }
}

new Search (new View());
