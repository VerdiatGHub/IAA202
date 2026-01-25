import React, { useState } from 'react';
import {
    Settings,
    Globe,
    Bell,
    Shield,
    Database,
    Mail,
    Palette,
    Save,
    RefreshCw,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import toast from 'react-hot-toast';
import './AdminSettings.css';

interface SettingsSection {
    id: string;
    title: string;
    icon: React.ReactNode;
}

export const AdminSettings: React.FC = () => {
    const [activeSection, setActiveSection] = useState('general');
    const [saving, setSaving] = useState(false);

    // General Settings
    const [siteName, setSiteName] = useState('EduLearn');
    const [siteDescription, setSiteDescription] = useState('Online Learning Management System');
    const [supportEmail, setSupportEmail] = useState('support@lms.local');
    const [maxFileSize, setMaxFileSize] = useState('50');

    // Notification Settings
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [enrollmentNotifications, setEnrollmentNotifications] = useState(true);
    const [gradeNotifications, setGradeNotifications] = useState(true);

    // Security Settings
    const [sessionTimeout, setSessionTimeout] = useState('60');
    const [maxLoginAttempts, setMaxLoginAttempts] = useState('5');
    const [passwordMinLength, setPasswordMinLength] = useState('8');

    const sections: SettingsSection[] = [
        { id: 'general', title: 'General', icon: <Globe size={20} /> },
        { id: 'notifications', title: 'Notifications', icon: <Bell size={20} /> },
        { id: 'security', title: 'Security', icon: <Shield size={20} /> },
        { id: 'email', title: 'Email', icon: <Mail size={20} /> },
        { id: 'appearance', title: 'Appearance', icon: <Palette size={20} /> },
        { id: 'maintenance', title: 'Maintenance', icon: <Database size={20} /> },
    ];

    const handleSave = async () => {
        setSaving(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setSaving(false);
        toast.success('Settings saved successfully');
    };

    const renderGeneralSettings = () => (
        <div className="settings-form">
            <div className="form-group">
                <label>Site Name</label>
                <Input
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    placeholder="Enter site name"
                />
            </div>
            <div className="form-group">
                <label>Site Description</label>
                <Input
                    value={siteDescription}
                    onChange={(e) => setSiteDescription(e.target.value)}
                    placeholder="Enter site description"
                />
            </div>
            <div className="form-group">
                <label>Support Email</label>
                <Input
                    type="email"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    placeholder="support@example.com"
                />
            </div>
            <div className="form-group">
                <label>Max File Upload Size (MB)</label>
                <Input
                    type="number"
                    value={maxFileSize}
                    onChange={(e) => setMaxFileSize(e.target.value)}
                    placeholder="50"
                />
            </div>
        </div>
    );

    const renderNotificationSettings = () => (
        <div className="settings-form">
            <div className="form-group">
                <label className="toggle-label">
                    <span>Email Notifications</span>
                    <input
                        type="checkbox"
                        checked={emailNotifications}
                        onChange={(e) => setEmailNotifications(e.target.checked)}
                        className="toggle-input"
                    />
                    <span className="toggle-switch"></span>
                </label>
                <p className="form-hint">Send email notifications to users</p>
            </div>
            <div className="form-group">
                <label className="toggle-label">
                    <span>Enrollment Notifications</span>
                    <input
                        type="checkbox"
                        checked={enrollmentNotifications}
                        onChange={(e) => setEnrollmentNotifications(e.target.checked)}
                        className="toggle-input"
                    />
                    <span className="toggle-switch"></span>
                </label>
                <p className="form-hint">Notify instructors when students enroll in their courses</p>
            </div>
            <div className="form-group">
                <label className="toggle-label">
                    <span>Grade Notifications</span>
                    <input
                        type="checkbox"
                        checked={gradeNotifications}
                        onChange={(e) => setGradeNotifications(e.target.checked)}
                        className="toggle-input"
                    />
                    <span className="toggle-switch"></span>
                </label>
                <p className="form-hint">Notify students when their assignments are graded</p>
            </div>
        </div>
    );

    const renderSecuritySettings = () => (
        <div className="settings-form">
            <div className="form-group">
                <label>Session Timeout (minutes)</label>
                <Input
                    type="number"
                    value={sessionTimeout}
                    onChange={(e) => setSessionTimeout(e.target.value)}
                    placeholder="60"
                />
                <p className="form-hint">Automatically log out users after inactivity</p>
            </div>
            <div className="form-group">
                <label>Max Login Attempts</label>
                <Input
                    type="number"
                    value={maxLoginAttempts}
                    onChange={(e) => setMaxLoginAttempts(e.target.value)}
                    placeholder="5"
                />
                <p className="form-hint">Lock account after failed login attempts</p>
            </div>
            <div className="form-group">
                <label>Minimum Password Length</label>
                <Input
                    type="number"
                    value={passwordMinLength}
                    onChange={(e) => setPasswordMinLength(e.target.value)}
                    placeholder="8"
                />
                <p className="form-hint">Minimum characters required for passwords</p>
            </div>
        </div>
    );

    const renderEmailSettings = () => (
        <div className="settings-form">
            <div className="form-group">
                <label>SMTP Host</label>
                <Input placeholder="smtp.example.com" />
            </div>
            <div className="form-group">
                <label>SMTP Port</label>
                <Input type="number" placeholder="587" />
            </div>
            <div className="form-group">
                <label>SMTP Username</label>
                <Input placeholder="username" />
            </div>
            <div className="form-group">
                <label>SMTP Password</label>
                <Input type="password" placeholder="••••••••" />
            </div>
            <div className="form-group">
                <label>From Email Address</label>
                <Input type="email" placeholder="noreply@example.com" />
            </div>
            <Button variant="outline" icon={<Mail size={18} />}>
                Send Test Email
            </Button>
        </div>
    );

    const renderAppearanceSettings = () => (
        <div className="settings-form">
            <div className="form-group">
                <label>Primary Color</label>
                <div className="color-picker-group">
                    <input type="color" defaultValue="#6366f1" className="color-picker" />
                    <Input defaultValue="#6366f1" placeholder="#6366f1" />
                </div>
            </div>
            <div className="form-group">
                <label>Logo URL</label>
                <Input placeholder="https://example.com/logo.png" />
            </div>
            <div className="form-group">
                <label>Favicon URL</label>
                <Input placeholder="https://example.com/favicon.ico" />
            </div>
            <div className="form-group">
                <label className="toggle-label">
                    <span>Allow Dark Mode</span>
                    <input type="checkbox" defaultChecked className="toggle-input" />
                    <span className="toggle-switch"></span>
                </label>
                <p className="form-hint">Let users switch between light and dark themes</p>
            </div>
        </div>
    );

    const renderMaintenanceSettings = () => (
        <div className="settings-form">
            <div className="form-group">
                <label className="toggle-label">
                    <span>Maintenance Mode</span>
                    <input type="checkbox" className="toggle-input" />
                    <span className="toggle-switch"></span>
                </label>
                <p className="form-hint">Put the site in maintenance mode (only admins can access)</p>
            </div>
            <div className="maintenance-actions">
                <Card className="maintenance-card">
                    <CardContent>
                        <h4>Clear Cache</h4>
                        <p>Clear all cached data to free up space</p>
                        <Button variant="outline" icon={<RefreshCw size={18} />}>
                            Clear Cache
                        </Button>
                    </CardContent>
                </Card>
                <Card className="maintenance-card">
                    <CardContent>
                        <h4>Database Backup</h4>
                        <p>Create a backup of the database</p>
                        <Button variant="outline" icon={<Database size={18} />}>
                            Create Backup
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );

    const renderContent = () => {
        switch (activeSection) {
            case 'general':
                return renderGeneralSettings();
            case 'notifications':
                return renderNotificationSettings();
            case 'security':
                return renderSecuritySettings();
            case 'email':
                return renderEmailSettings();
            case 'appearance':
                return renderAppearanceSettings();
            case 'maintenance':
                return renderMaintenanceSettings();
            default:
                return renderGeneralSettings();
        }
    };

    return (
        <div className="admin-settings">
            <section className="settings-header">
                <div className="header-content">
                    <h1 className="page-title">
                        <Settings size={28} />
                        Platform Settings
                    </h1>
                    <p className="page-subtitle">Configure your learning management system</p>
                </div>
                <Button
                    variant="primary"
                    icon={<Save size={18} />}
                    onClick={handleSave}
                    loading={saving}
                >
                    Save Changes
                </Button>
            </section>

            <div className="settings-layout">
                <nav className="settings-nav">
                    {sections.map((section) => (
                        <button
                            key={section.id}
                            className={`nav-item ${activeSection === section.id ? 'active' : ''}`}
                            onClick={() => setActiveSection(section.id)}
                        >
                            {section.icon}
                            <span>{section.title}</span>
                        </button>
                    ))}
                </nav>

                <Card className="settings-content">
                    <CardHeader>
                        <CardTitle>
                            {sections.find(s => s.id === activeSection)?.icon}
                            {sections.find(s => s.id === activeSection)?.title} Settings
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {renderContent()}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AdminSettings;
