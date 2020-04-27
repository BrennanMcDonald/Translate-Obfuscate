import React from "react";
import ReactDOM from 'react-dom';
import dotenv from 'dotenv';
import GoogleTranslate from 'google-translate';
import ReactGA from 'react-ga';

import {
    Dropdown,
    Button,
    Container,
    TextArea,
    Form,
} from 'semantic-ui-react';

dotenv.config();

ReactGA.initialize('UA-79437382-4');
ReactGA.pageview(window.location.pathname + window.location.search);

const Translator = GoogleTranslate("AIzaSyDdHaxMLvjblyat6PN3wk5u6TV0Dplj41Y", {})

function translateForDropdown(item) {
    return {
        key: item.language,
        text: item.name,
        value: item.name
    }
}

class Obfs extends React.Component {
    constructor(props) {
        super(props);
        var that = this;

        this.state = {
            inputText: "",
            translation: "",
            translatedText: "",
            languages: ["en"],
            SupportedLanguages: [],
            translationChain: []
        };

        Translator.getSupportedLanguages("en", function (_, b) {
            that.setState({
                SupportedLanguages: b.map(x => translateForDropdown(x))
            });
        });

        this.onChange = this.onChange.bind(this);
        this.translate = this.translate.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
    }

    componentDidMount() {
        // this.translate(this.state.inputText, this.state.languages[this.state.languages.length-1]);
    }

    onChange(e) {
        clearTimeout(this.state.stableTimer)
        var timeoutTimer = setTimeout(this.onStable.bind(this, e.target.name), 1000);
        this.setState({
            [e.target.name]: e.target.value,
            stableTimer: timeoutTimer
        });

    }

    onSubmit(e) {
        e.preventDefault();
        clearTimeout(this.state.stableTimer)
        this.translate(this.state.inputText)
        return false;
    }

    onStable(name) {
        if (name === "inputText") {
            this.translate(this.state.inputText)
        }
    }

    translate(text) {
        if (text) {
            this.setState({
                translatedText: this.state.inputText
            })
            this.nextTranslation(text, this.state.languages, 0);

        }
        else
            alert("No text entered")
    }

    nextTranslation(text, languageList, i) {
        var that = this;
        console.log(i, languageList.length)
        if (i > languageList.length) {
            return "done"
        }
        Translator.translate(text, languageList[i], function (err, translation) {
            console.log(i)
            if (err) {
                console.error(err.body);
            } else {
                var chain = that.state.translationChain;
                chain.push(translation.translatedText);
                that.setState({
                    translatedText: translation.translatedText,
                    translationChain: chain,
                    step: i
                });
                console.log(that.state)

                return that.nextTranslation(translation.translatedText, languageList, i + 1)
            }
        });
    }

    render() {
        return (<Container>
            <br />
            <br />
            {this.state.translation} <br />
            <Form>
                <Container className="translationContent">
                    <LanguageChainer languages={this.state.SupportedLanguages} onChange={this.onChange} step={this.state.step} />
                    <div className="headerRow">
                        <div className="leftHeader">
                            Input
                        </div>
                        <div className="rightHeader">
                            Output
                        </div>
                        <div className="leftContent">
                            <TextArea name="inputText" value={this.state.inputText} onChange={this.onChange} />
                        </div>
                        <div className="rightContent">
                            <TextArea name="outputText" value={this.state.translatedText} />
                        </div>
                    </div>
                </Container>
                <br />
                <br />
                <Button primary floated="right" onClick={this.onSubmit}>Translate</Button>
                <br />
            </Form>
        </Container>)
    }
}

class LanguageDropdown extends React.Component {
    constructor(props) {
        super(props);

        this.onChange = this.onChange.bind(this);
    }

    onChange(_, data) {
        var { value } = data;
        var { key } = data.options.find(o => o.value === value)
        var onChangeResult = {
            target: {
                name: this.props.name,
                value: key
            }
        }
        this.props.onChange(onChangeResult)
    }

    render() {
        return (
            <Dropdown
                placeholder='Select Language'
                fluid
                search
                selection
                onChange={this.onChange}
                options={this.props.languages}
            />
        )
    }
}

class LangaugeChain extends React.Component {
    render() {
        return (
            <table>
                <thead>
                    <tr class="ribbon-container">
                        {
                            this.props.languages.map((x, i) => {
                                if (i === this.props.step) {
                                    return <th key={x} className="ribbon current">{x}</th>
                                } else {
                                    return <th key={x} className="ribbon">{x}</th>
                                }
                            })
                        }
                    </tr>
                </thead>
            </table>
        )
    }

}

class LanguageChainer extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            languages: ["en"],
            newLanguage: ""
        }

        this.onChange = this.onChange.bind(this);
        this.addLanguage = this.addLanguage.bind(this);
    }

    onChange(e) {
        this.setState({
            [e.target.name]: e.target.value
        })
    }

    addLanguage() {
        var languageList = this.state.languages
        if (this.state.newLanguage !== "") {
            if (languageList[languageList.length - 1] !== this.state.newLanguage)
                languageList.push(this.state.newLanguage)
            this.setState({
                languages: languageList
            });
            var onChangeResult = {
                target: {
                    name: 'languages',
                    value: this.state.languages
                }
            }
            this.props.onChange(onChangeResult)
        }
    }

    render() {
        return (
            <div>
                <LangaugeChain languages={this.state.languages} step={this.props.step}></LangaugeChain>
                <br />
                <LanguageDropdown name="newLanguage" value={this.state.newLanguage} onChange={this.onChange} languages={this.props.languages} />
                <Button onClick={this.addLanguage} floated="right">+</Button>
                <br />
                <br />
            </div>
        )
    }
}

ReactDOM.render(<Obfs />, document.getElementById("root"))