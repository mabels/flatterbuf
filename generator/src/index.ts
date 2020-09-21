import {cmd} from './gen';

cmd(...process.argv)
    .then((_) => console.log(`Done`))
    .catch(console.error);
